import os
import re
import tempfile
import subprocess
import shutil
from typing import Tuple, Optional, List, Dict
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def sanitize_latex(latex_code: str) -> Tuple[str, List[str]]:
    r"""
    Sanitize LaTeX code:
    - Strip markdown fences (```latex ... ```)
    - Trim preamble/postscript text around \documentclass and \end{document}
    - Strictly eliminate em dashes ('—') and replace with standard LaTeX en dash '--'
    - Sanitize Unicode quotes and apostrophes
    - Escape unescaped %, &, #, $, _ in text lines
    - Auto-wrap bare bullet items in \resumeItem{...}
    - Balance unclosed \resumeItemListStart and \resumeSubHeadingListStart
    - Eliminate illegal empty nesting between \resumeSubHeadingListStart and \resumeItemListStart
    - Return sanitized code and list of fixes made
    """
    fixes = []
    if not latex_code:
        return "", fixes

    cleaned = latex_code.strip()

    # 1. Strip markdown fences if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:latex|tex)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        fixes.append("Stripped outer markdown code block delimiters.")

    # 2. Extract strictly from \documentclass to \end{document} if surrounded by markdown commentary
    if "\\documentclass" in cleaned:
        doc_start = cleaned.find("\\documentclass")
        if doc_start > 0:
            cleaned = cleaned[doc_start:]
            fixes.append("Removed preamble commentary before \\documentclass.")
            
    if "\\end{document}" in cleaned:
        doc_end = cleaned.rfind("\\end{document}") + len("\\end{document}")
        if doc_end < len(cleaned):
            cleaned = cleaned[:doc_end]
            fixes.append("Removed postscript commentary after \\end{document}.")

    # 3. Em dash check
    if "—" in cleaned:
        em_dash_count = cleaned.count("—")
        cleaned = cleaned.replace("—", " -- ")
        fixes.append(f"Replaced {em_dash_count} em dash(es) ('—') with standard LaTeX en dash ('--').")

    # 4. Smart quotes / curly quotes
    if "“" in cleaned or "”" in cleaned:
        cleaned = cleaned.replace("“", "``").replace("”", "''")
        fixes.append("Converted smart double quotes to LaTeX quotes (`` ... '').")
    if "’" in cleaned or "‘" in cleaned:
        cleaned = cleaned.replace("’", "'").replace("‘", "`")
        fixes.append("Converted smart single quotes/apostrophes to ASCII quotes.")

    # Separate preamble from document body so macro definitions aren't altered by line sanitization
    if "\\begin{document}" in cleaned:
        preamble, body = cleaned.split("\\begin{document}", 1)
        in_body = True
    else:
        preamble = ""
        body = cleaned
        in_body = False

    lines = body.splitlines()
    sanitized_lines = []
    in_tabular = False
    
    for line in lines:
        stripped = line.strip()
        
        # Track tabular environments where raw '&' is the column separator
        if "\\begin{tabular" in stripped:
            in_tabular = True
            sanitized_lines.append(line)
            continue
        if "\\end{tabular" in stripped:
            in_tabular = False
            sanitized_lines.append(line)
            continue
            
        # If line is a comment, don't modify escapes inside it
        if stripped.startswith("%"):
            sanitized_lines.append(line)
            continue

        mod_line = line

        # 5. Escape unescaped % (unescaped % comments out the line and destroys closing braces)
        if "%" in mod_line:
            new_line = re.sub(r"(?<!\\)%", r"\%", mod_line)
            if new_line != mod_line:
                fixes.append("Escaped unescaped '%' character.")
                mod_line = new_line

        # 6. Escape unescaped & (when not inside tabular environment)
        if not in_tabular and "&" in mod_line:
            new_line = re.sub(r"(?<!\\)&", r"\&", mod_line)
            if new_line != mod_line:
                fixes.append("Escaped unescaped '&' character outside tabular environment.")
                mod_line = new_line

        # 7. Escape unescaped # (e.g. C# -> C\#, #1 -> \#1)
        if "#" in mod_line:
            if not ("\\newcommand" in mod_line or "\\def" in mod_line):
                new_line = re.sub(r"(?<!\\)#", r"\#", mod_line)
                if new_line != mod_line:
                    fixes.append("Escaped unescaped '#' character.")
                    mod_line = new_line

        # 8. Escape unescaped single $ (e.g. $50,000 -> \$50,000)
        if "$" in mod_line:
            new_line = re.sub(r"(?<!\\)\$(\d)", r"\\$\1", mod_line)
            unescaped_dollars = len(re.findall(r"(?<!\\)\$", new_line))
            if unescaped_dollars % 2 != 0:
                new_line = re.sub(r"(?<!\\)\$", r"\\$", new_line)
                fixes.append("Escaped unmatched '$' currency symbol.")
            elif new_line != mod_line:
                fixes.append("Escaped '$' currency symbol.")
            mod_line = new_line

        # 9. Escape unescaped _ in normal text
        if "_" in mod_line and "\\href" not in mod_line and "\\url" not in mod_line:
            new_line = re.sub(r"(?<!\\)_", r"\_", mod_line)
            if new_line != mod_line:
                fixes.append("Escaped unescaped '_' underscore.")
                mod_line = new_line

        # 10. Auto-wrap bare bullet items inside body if missing \resumeItem or \item
        if mod_line.strip().startswith(("- ", "• ", "* ")) and not mod_line.strip().startswith(("\\item", "\\resumeItem")):
            content = re.sub(r"^[-•*]\s*", "", mod_line.strip())
            mod_line = f"    \\resumeItem{{{content}}}"
            fixes.append("Wrapped bare bullet item in \\resumeItem{...}.")

        sanitized_lines.append(mod_line)

    body = "\n".join(sanitized_lines)

    # 11. Fix invalid empty nesting where \resumeSubHeadingListStart is followed immediately by \resumeItemListStart
    empty_nesting_pattern = r"\\resumeSubHeadingListStart(\s*)\\resumeItemListStart"
    if re.search(empty_nesting_pattern, body):
        body = re.sub(empty_nesting_pattern, r"\1\\resumeItemListStart", body)
        body = re.sub(r"(\\resumeItemListEnd\s*)\\resumeSubHeadingListEnd", r"\1", body)
        fixes.append("Normalized direct nested itemize lists.")

    # 12. Environment balancing in body
    item_start_count = body.count(r"\resumeItemListStart")
    item_end_count = body.count(r"\resumeItemListEnd")
    if item_start_count > item_end_count:
        diff = item_start_count - item_end_count
        if r"\resumeSubHeadingListEnd" in body:
            body = re.sub(r"(\\resumeSubHeadingListEnd)", r"\\resumeItemListEnd\n\1", body, count=diff)
            fixes.append(f"Balanced {diff} unclosed \\resumeItemListStart environment(s).")

    sub_start_count = body.count(r"\resumeSubHeadingListStart")
    sub_end_count = body.count(r"\resumeSubHeadingListEnd")
    if sub_start_count > sub_end_count:
        diff = sub_start_count - sub_end_count
        if r"\end{document}" in body:
            body = re.sub(r"(\\end\{document\})", r"\\resumeSubHeadingListEnd\n\1", body, count=diff)
            fixes.append(f"Balanced {diff} unclosed \\resumeSubHeadingListStart environment(s).")

    if in_body:
        cleaned = preamble + "\\begin{document}" + body
    else:
        cleaned = body

    return cleaned, list(set(fixes))

def parse_tectonic_errors(output: str) -> List[Dict[str, str]]:
    """Parse Tectonic/LaTeX output to extract line numbers and error descriptions."""
    errors = []
    lines = output.splitlines()
    for line in lines:
        if line.startswith("!") or "error:" in line.lower():
            # Look for line number
            match = re.search(r"l\.(\d+)", line)
            line_no = match.group(1) if match else "unknown"
            errors.append({"line": line_no, "message": line.strip()})
    if not errors and output:
        # Fallback error extractor
        for line in lines[-10:]:
            if "fatal" in line.lower() or "error" in line.lower():
                errors.append({"line": "general", "message": line.strip()})
    return errors

def get_tectonic_executable() -> Optional[str]:
    """Finds or unpacks tectonic binary for the current environment."""
    # 1. Check system PATH
    path = shutil.which("tectonic")
    if path and os.access(path, os.X_OK):
        return path

    # 2. Check /tmp/tectonic
    tmp_tectonic = "/tmp/tectonic"
    if os.path.isfile(tmp_tectonic) and os.access(tmp_tectonic, os.X_OK):
        return tmp_tectonic

    # 3. Check bundled tar.gz
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    bundled_tar = os.path.join(base_dir, "bin", "tectonic-linux-x86_64.tar.gz")
    if os.path.isfile(bundled_tar):
        try:
            import tarfile
            with tarfile.open(bundled_tar, "r:gz") as tar:
                for member in tar.getmembers():
                    if member.name == "tectonic" or member.name.endswith("/tectonic"):
                        member.name = "tectonic"
                        tar.extract(member, path="/tmp")
                        os.chmod(tmp_tectonic, 0o755)
                        return tmp_tectonic
        except Exception as e:
            print(f"Failed to unpack bundled tectonic: {e}")

    # 4. Fallback: download if missing in Linux serverless
    try:
        import urllib.request
        import tarfile
        url = "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@0.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz"
        tar_path = "/tmp/tectonic.tar.gz"
        urllib.request.urlretrieve(url, tar_path)
        with tarfile.open(tar_path, "r:gz") as tar:
            for member in tar.getmembers():
                if member.name == "tectonic" or member.name.endswith("/tectonic"):
                    member.name = "tectonic"
                    tar.extract(member, path="/tmp")
                    os.chmod(tmp_tectonic, 0o755)
                    return tmp_tectonic
    except Exception as e:
        print(f"Failed to download tectonic fallback: {e}")

    return None

def compile_latex_to_pdf(latex_code: str) -> Tuple[Optional[bytes], Optional[str], List[str]]:
    """
    Compiles LaTeX to PDF using Tectonic.
    Returns: (pdf_bytes, error_message, fixes_applied)
    """
    latex_code, fixes = sanitize_latex(latex_code)
    
    tectonic_bin = get_tectonic_executable()
    if not tectonic_bin:
        return None, "Tectonic LaTeX compiler not found on system PATH or serverless environment.", fixes

    env = os.environ.copy()
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or not os.access(os.path.expanduser("~"), os.W_OK):
        cache_dir = os.getenv("TECTONIC_CACHE_DIR", "/tmp/tectonic_cache")
        os.makedirs(cache_dir, exist_ok=True)
        env["HOME"] = "/tmp"
        env["XDG_CONFIG_HOME"] = "/tmp"
        env["XDG_CACHE_HOME"] = "/tmp"
        env["XDG_DATA_HOME"] = "/tmp"
        env["TECTONIC_CACHE_DIR"] = cache_dir

    with tempfile.TemporaryDirectory() as temp_dir:
        tex_path = os.path.join(temp_dir, "resume.tex")
        pdf_path = os.path.join(temp_dir, "resume.pdf")
        
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_code)
            
        cmd = [tectonic_bin, "-o", temp_dir, tex_path]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=45, env=env)
            if res.returncode == 0 and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as pf:
                    pdf_bytes = pf.read()
                return pdf_bytes, None, fixes
            else:
                err_log = res.stderr + "\n" + res.stdout
                return None, err_log or "Compilation failed without output.", fixes
        except subprocess.TimeoutExpired:
            return None, "LaTeX compilation timed out after 45 seconds.", fixes
        except FileNotFoundError:
            return None, "Tectonic LaTeX compiler not found on system PATH.", fixes
        except Exception as e:
            return None, f"Unexpected compilation error: {str(e)}", fixes

def export_latex_to_docx(latex_code: str) -> bytes:
    """
    Converts LaTeX resume to high-quality Microsoft Word (.docx) document.
    First tries Pandoc for high-fidelity conversion, otherwise falls back to python-docx generator.
    """
    latex_code, _ = sanitize_latex(latex_code)
    
    # Try pandoc first
    if shutil.which("pandoc"):
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "resume.tex")
            docx_path = os.path.join(temp_dir, "resume.docx")
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_code)
            cmd = ["pandoc", "-f", "latex", "-t", "docx", tex_path, "-o", docx_path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and os.path.exists(docx_path):
                with open(docx_path, "rb") as df:
                    return df.read()

    # Fallback using python-docx
    doc = Document()
    
    # Page setup
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.5)
        s.bottom_margin = Inches(0.5)
        s.left_margin = Inches(0.5)
        s.right_margin = Inches(0.5)

    # Simple regex parsing of LaTeX commands
    lines = latex_code.splitlines()
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("%"):
            continue
            
        if r"\textbf{\Huge" in line or r"\textbf{\LARGE" in line:
            name_match = re.search(r"\\textbf\{\\Huge\s*(?:\\scshape\s*)?([^}]+)\}", line)
            name = name_match.group(1) if name_match else "Resume"
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(name)
            run.bold = True
            run.font.size = Pt(20)
            run.font.color.rgb = RGBColor(15, 23, 42)
            
        elif r"\section{" in line:
            sec_match = re.search(r"\\section\{([^}]+)\}", line)
            if sec_match:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(12)
                p.paragraph_format.space_after = Pt(3)
                run = p.add_run(sec_match.group(1).upper())
                run.bold = True
                run.font.size = Pt(12)
                run.font.color.rgb = RGBColor(30, 41, 59)
                
        elif r"\resumeItem{" in line or r"\item" in line:
            item_match = re.search(r"\\resumeItem\{([^}]+)\}", line) or re.search(r"\\item\s*(.*)", line)
            if item_match:
                raw_text = item_match.group(1)
                clean_text = re.sub(r"\\[a-zA-Z]+(?:\{[^}]*\})?", "", raw_text)
                clean_text = clean_text.replace(r"\%", "%").replace(r"\&", "&").replace(r"\_", "_").replace(r"\$", "$")
                p = doc.add_paragraph(clean_text, style='List Bullet')
                p.paragraph_format.space_after = Pt(2)
                
        elif r"\resumeSubheading" in line:
            # Experience / Education title lines
            matches = re.findall(r"\{([^}]+)\}", line)
            if len(matches) >= 2:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(1)
                r1 = p.add_run(matches[0] + " ")
                r1.bold = True
                if len(matches) >= 4:
                    r2 = p.add_run(f" | {matches[2]} ({matches[3]})")
                    r2.italic = True
                    
    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tf:
        docx_path = tf.name
    doc.save(docx_path)
    with open(docx_path, "rb") as df:
        docx_bytes = df.read()
    try:
        os.remove(docx_path)
    except:
        pass
    return docx_bytes
