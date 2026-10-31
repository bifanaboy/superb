#!/usr/bin/env bash
# Main test runner for OpenCode plugin test suite
# Runs all tests and reports results
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " OpenCode Plugin Test Suite"
echo "========================================"
echo ""
echo "Repository: $(cd ../.. && pwd)"
echo "Test time: $(date)"
echo ""

# Parse command line arguments
RUN_INTEGRATION=false
VERBOSE=false
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --integration, -i  Run integration tests (requires OpenCode)"
            echo "  --verbose, -v      Show verbose output"
            echo "  --test, -t NAME    Run only the specified test"
            echo "  --help, -h         Show this help"
            echo ""
            echo "Tests:"
            echo "  test-plugin-loading.sh  Verify plugin installation and structure"
            echo "  test-bootstrap-caching.sh  Verify bootstrap content caching"
            echo "  test-session-bootstrap.sh  Verify session classification and lookup recovery"
            echo "  test-todo-nudge.sh       Verify the todo nudge and the edit/shell gate"
            echo "  test-skill-registration.sh  Verify V2 skill registration contract (2.0.4 path field)"
            echo "  test-model-tiers.sh      Verify the fast/smart model role contract"
            echo "  test-pr-gate.sh         Verify the PR gate before any pull request"
            echo "  test-question-tool.sh   Verify fixed-choice questions use the question tool"
            echo "  test-subagent-naming.sh Verify subagent names carry the model role"
            echo "  test-ste100.sh          Verify root prose uses Simplified Technical English"
            echo "  test-dead-models.sh     Verify a failed model is skipped for the session"
            echo "  test-handoff-choice.sh  Verify the brainstorming handoff choice"
            echo "  test-competing-hypotheses.sh  Verify the competing-hypotheses reference"
            echo "  test-observability-evidence.sh  Verify the observability-evidence reference"
            echo "  test-dispatch-write-surface.sh  Verify the parallel-dispatch write-surface contract"
            echo "  test-ui-skills.sh       Verify the UI skills, references and fixtures"
            echo "  test-rename-complete.sh Verify the old plugin name is gone"
            echo "  test-brainstorm-helper.sh  Verify the companion WebSocket URL scheme"
            echo "  test-brainstorm-server.sh  Verify companion auth and WebSocket handling"
            echo "  test-find-polluter.sh   Verify the pre-existing pollution guard"
            echo "  test-task-brief.sh      Verify task briefs stop at the next section"
            echo "  test-sdd-scripts.sh     Verify the SDD workspace, ledger, and review scripts"
            echo "  test-no-orphan-hooks.sh Verify the orphaned hook files are gone"
            echo "  test-opencode-only.sh   Verify shipped files name only OpenCode"
            echo "  test-tools.sh           Test the native skill tool (integration)"
            echo "  test-priority.sh        Test skill priority resolution (integration)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# List of tests to run (no external dependencies)
tests=(
    "test-plugin-loading.sh"
    "test-bootstrap-caching.sh"
    "test-session-bootstrap.sh"
    "test-todo-nudge.sh"
    "test-skill-registration.sh"
    "test-model-tiers.sh"
    "test-pr-gate.sh"
    "test-question-tool.sh"
    "test-subagent-naming.sh"
    "test-ste100.sh"
    "test-dead-models.sh"
    "test-handoff-choice.sh"
    "test-competing-hypotheses.sh"
    "test-observability-evidence.sh"
    "test-dispatch-write-surface.sh"
    "test-ui-skills.sh"
    "test-rename-complete.sh"
    "test-brainstorm-helper.sh"
    "test-brainstorm-server.sh"
    "test-find-polluter.sh"
    "test-task-brief.sh"
    "test-sdd-scripts.sh"
    "test-no-orphan-hooks.sh"
    "test-opencode-only.sh"
)

# Integration tests (require OpenCode)
integration_tests=(
    "test-tools.sh"
    "test-priority.sh"
)

# Add integration tests if requested
if [ "$RUN_INTEGRATION" = true ]; then
    tests+=("${integration_tests[@]}")
fi

# Filter to specific test if requested
if [ -n "$SPECIFIC_TEST" ]; then
    tests=("$SPECIFIC_TEST")
fi

# Track results
passed=0
failed=0
skipped=0

# Run each test
for test in "${tests[@]}"; do
    echo "----------------------------------------"
    echo "Running: $test"
    echo "----------------------------------------"

    test_path="$SCRIPT_DIR/$test"

    if [ ! -f "$test_path" ]; then
        echo "  [SKIP] Test file not found: $test"
        skipped=$((skipped + 1))
        continue
    fi

    if [ ! -x "$test_path" ]; then
        echo "  Making $test executable..."
        chmod +x "$test_path"
    fi

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if bash "$test_path"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [PASS] $test (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [FAIL] $test (${duration}s)"
            failed=$((failed + 1))
        fi
    else
        # Capture output for non-verbose mode
        if output=$(bash "$test_path" 2>&1); then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [PASS] (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [FAIL] (${duration}s)"
            echo ""
            echo "  Output:"
            echo "$output" | sed 's/^/    /'
            failed=$((failed + 1))
        fi
    fi

    echo ""
done

# Print summary
echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo ""
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$RUN_INTEGRATION" = false ] && [ ${#integration_tests[@]} -gt 0 ]; then
    echo "Note: Integration tests were not run."
    echo "Use --integration flag to run tests that require OpenCode."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED"
    exit 0
fi
