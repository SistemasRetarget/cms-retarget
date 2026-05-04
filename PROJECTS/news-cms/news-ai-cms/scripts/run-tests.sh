#!/bin/bash

# CMS Test Suite Runner
# Runs all functional tests and generates reports

set -e

echo "📋 CMS News Test Suite"
echo "===================="
echo ""

# Check if server is running
echo "✓ Checking API server..."
curl -f -s http://localhost:3000/api/health > /dev/null || {
  echo "❌ API server not running on :3000"
  echo "   Start with: npm run dev"
  exit 1
}

echo "✓ API server is running"
echo ""

# Run tests
echo "🧪 Running E2E tests..."
npx playwright test tests/ \
  --reporter=html \
  --reporter=json \
  --reporter=list

echo ""
echo "📊 Test Results"
echo "==============="
echo "Reports generated:"
echo "  - HTML: playwright-report/index.html"
echo "  - JSON: test-results.json"
echo ""

# Summary
FAILED=$(npx playwright show-report 2>/dev/null | grep -c "failed" || echo "0")
PASSED=$(npx playwright show-report 2>/dev/null | grep -c "passed" || echo "0")

echo "✅ Test run complete"
