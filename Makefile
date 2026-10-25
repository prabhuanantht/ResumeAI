.PHONY: help setup install run dev run-backend run-frontend build test clean env

PYTHON := python3
VENV := backend/venv
VENV_BIN := $(VENV)/bin

help: ## Show this help message
	@echo "=========================================================="
	@echo " TeXCraft Studio - Makefile Commands                      "
	@echo "=========================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: install env ## Full initial setup (install dependencies + configure environment)

install: ## Install backend and frontend dependencies
	@echo "==> Setting up Python virtual environment in backend/venv..."
	@test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	@echo "==> Installing Python dependencies..."
	@$(VENV_BIN)/pip install --upgrade pip
	@$(VENV_BIN)/pip install -r backend/requirements.txt
	@echo "==> Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "==> Setup complete!"

env: ## Ensure .env files exist with proper defaults
	@if [ ! -f .env ]; then \
		echo "GEMINI_API_KEY=" > .env; \
		echo "GEMINI_MODEL=gemini-2.5-flash" >> .env; \
		echo "PORT=8000" >> .env; \
		echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> .env; \
		echo "==> Created root .env"; \
	fi
	@if [ ! -f backend/.env ]; then \
		cp .env backend/.env; \
		echo "==> Created backend/.env"; \
	fi

run: ## Run both backend (FastAPI) and frontend (Next.js) concurrently
	@echo "==> Launching TeXCraft Studio..."
	@./run.sh

dev: run ## Alias for 'make run'

run-backend: ## Run only the FastAPI backend (http://localhost:8000)
	@echo "==> Starting FastAPI backend on http://localhost:8000..."
	@cd backend && ../$(VENV_BIN)/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend: ## Run only the Next.js frontend (http://localhost:3000)
	@echo "==> Starting Next.js frontend on http://localhost:3000..."
	@cd frontend && npm run dev

build: ## Build frontend for production
	@echo "==> Building Next.js production bundle..."
	@cd frontend && npm run build

test: ## Run verification test for LaTeX compiler and ATS scorer
	@echo "==> Testing Tectonic LaTeX compilation & ATS engine..."
	@PYTHONPATH=. $(VENV_BIN)/python3 -c "from backend.app.services.compiler import compile_latex_to_pdf; from backend.app.services.templates import DEFAULT_PRIMARY_RESUME; pdf, err, fixes = compile_latex_to_pdf(DEFAULT_PRIMARY_RESUME); print('PDF Test:', 'SUCCESS' if pdf else 'FAILED: ' + str(err))"
	@PYTHONPATH=. $(VENV_BIN)/python3 -c "from backend.app.services.ats_scorer import score_resume_against_job; from backend.app.services.templates import DEFAULT_PRIMARY_RESUME; res = score_resume_against_job(DEFAULT_PRIMARY_RESUME, 'Looking for Python and Kubernetes engineer'); print('ATS Engine Test:', 'SUCCESS, score=' + str(res.overall_score))"

clean: ## Clean build caches and temporary files
	@echo "==> Cleaning cache and temporary files..."
	@rm -rf frontend/.next frontend/out
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@rm -rf /tmp/tectonic*
	@echo "==> Cleaned!"
