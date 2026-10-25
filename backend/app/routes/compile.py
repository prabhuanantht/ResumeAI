import io
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
from backend.app.models import CompileRequest
from backend.app.services.compiler import compile_latex_to_pdf, export_latex_to_docx, sanitize_latex, parse_tectonic_errors

router = APIRouter(prefix="/api/compile", tags=["Compilation"])

@router.post("/pdf")
async def compile_to_pdf(req: CompileRequest):
    pdf_bytes, err_log, fixes = compile_latex_to_pdf(req.latex_code)
    if err_log or not pdf_bytes:
        errors = parse_tectonic_errors(err_log or "Unknown error")
        return Response(
            content=err_log or "Compilation failed",
            status_code=400,
            media_type="text/plain"
        )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{req.filename or "resume"}.pdf"',
            "Cache-Control": "no-cache"
        }
    )

@router.post("/docx")
async def compile_to_docx(req: CompileRequest):
    docx_bytes = export_latex_to_docx(req.latex_code)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{req.filename or "resume"}.docx"'
        }
    )

@router.post("/validate")
async def validate_latex(req: CompileRequest):
    sanitized, fixes = sanitize_latex(req.latex_code)
    pdf_bytes, err_log, _ = compile_latex_to_pdf(sanitized)
    if err_log:
        errors = parse_tectonic_errors(err_log)
        return {
            "valid": False,
            "errors": errors,
            "raw_log": err_log,
            "fixes_applied": fixes
        }
    return {
        "valid": True,
        "errors": [],
        "raw_log": "",
        "fixes_applied": fixes
    }
