#!/bin/bash
# Pre-deploy security & quality checks
# Ejecutar: bash scripts/pre-deploy.sh

set -e

echo "🔍 CMS Retarget — Pre-Deploy Audit"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# 1. npm audit
echo -e "\n${YELLOW}1. Auditing dependencies...${NC}"
if npm audit --production 2>&1 | grep -q "0 vulnerabilities"; then
  echo -e "${GREEN}✓ No vulnerabilities${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠ Vulnerabilities found (review SECURITY.md)${NC}"
  npm audit --production || true
  ((FAIL++))
fi

# 2. TypeScript
echo -e "\n${YELLOW}2. Type checking...${NC}"
if npx tsc --noEmit 2>&1; then
  echo -e "${GREEN}✓ TypeScript OK${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ TypeScript errors${NC}"
  ((FAIL++))
fi

# 3. ESLint
echo -e "\n${YELLOW}3. Linting...${NC}"
if npm run lint 2>&1 | tail -3; then
  echo -e "${GREEN}✓ ESLint OK${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ ESLint warnings (check output)${NC}"
fi

# 4. Build
echo -e "\n${YELLOW}4. Building...${NC}"
if npm run build 2>&1 | tail -5; then
  echo -e "${GREEN}✓ Build successful${NC}"
  ((PASS++))
else
  echo -e "${RED}✗ Build failed${NC}"
  ((FAIL++))
fi

# 5. Check .env is not tracked
echo -e "\n${YELLOW}5. Checking .env is ignored...${NC}"
if git ls-files | grep -q "^\.env"; then
  echo -e "${RED}✗ .env is tracked!${NC}"
  ((FAIL++))
else
  echo -e "${GREEN}✓ .env ignored${NC}"
  ((PASS++))
fi

# 6. Check data/*.db is not tracked
echo -e "\n${YELLOW}6. Checking database is ignored...${NC}"
if git ls-files | grep -q "data/.*\.db$"; then
  echo -e "${RED}✗ Database files tracked!${NC}"
  ((FAIL++))
else
  echo -e "${GREEN}✓ Database ignored${NC}"
  ((PASS++))
fi

# 7. Check for secrets in staged changes
echo -e "\n${YELLOW}7. Scanning for secrets...${NC}"
if git diff --cached | grep -iE "(secret|password|api.?key|token|apikey|bearer)" | grep -v "NEXT_PUBLIC" > /dev/null; then
  echo -e "${RED}✗ Potential secrets in staged changes!${NC}"
  git diff --cached | grep -iE "(secret|password|api.?key|token|apikey|bearer)"
  ((FAIL++))
else
  echo -e "${GREEN}✓ No secrets detected${NC}"
  ((PASS++))
fi

# Summary
echo -e "\n=================================="
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}❌ PRE-DEPLOY CHECK FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Ready to deploy${NC}"
  exit 0
fi
