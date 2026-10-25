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
    """
    Sanitize LaTeX code:
    - Strictly eliminate em dashes ('—') and replace with standard LaTeX en dash '--'
    - Sanitize commonly broken unescaped characters in text
    - Return sanitized code and list of fixes made
    """
    fixes = []
    
    # 1. Em dash check
    if "—" in latex_code:
        em_dash_count = latex_code.count("—")
        latex_code = latex_code.replace("—", " -- ")
        fixes.append(f"Replaced {em_dash_count} em dash(es) ('—') with standard LaTeX en dash ('--').")
        
    # 2. Check for typical unicode quotes
    if "“" in latex_code or "”" in latex_code:
        latex_code = latex_code.replace("“", "``").replace("”", "''")
        fixes.append("Converted smart double quotes to LaTeX quotes (`` ... '').")
    if "’" in latex_code or "‘" in latex_code:
        latex_code = latex_code.replace("’", "'").replace("‘", "`")
        fixes.append("Converted smart single quotes/apostrophes to ASCII quotes.")

    return latex_code, fixes

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

def compile_latex_to_pdf(latex_code: str) -> Tuple[Optional[bytes], Optional[str], List[str]]:
    """
    Compiles LaTeX to PDF using Tectonic.
    Returns: (pdf_bytes, error_message, fixes_applied)
    """
    latex_code, fixes = sanitize_latex(latex_code)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_path = os.path.join(temp_dir, "resume.tex")
        pdf_path = os.path.join(temp_dir, "resume.pdf")
        
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_code)
            
        cmd = ["tectonic", "-o", temp_dir, tex_path]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
            if res.returncode == 0 and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as pf:
                    pdf_bytes = pf.read()
                return pdf_bytes, None, fixes
            else:
                err_log = res.stderr + "\n" + res.stdout
                return None, err_log or "Compilation failed without output.", fixes
        except subprocess.TimeoutExpired:
            return None, "LaTeX compilation timed out after 30 seconds.", fixes
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
