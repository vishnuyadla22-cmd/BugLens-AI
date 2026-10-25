import pytest
from backend.app.schemas.analysis import SupportedLanguage
from backend.app.schemas.execution import ExecutionStatus
from backend.app.services.sandbox_service import sandbox_service


def test_python_successful_execution():
    code = """
a = int(input())
b = int(input())
print(a + b)
"""
    res = sandbox_service.execute_python(
        code=code,
        custom_input="15\n25\n",
        expected_output="40\n",
    )
    assert res.status == ExecutionStatus.SUCCESS
    assert res.exit_code == 0
    assert res.stdout.strip() == "40"
    assert res.comparison is not None
    assert res.comparison.is_match is True


def test_python_runtime_error():
    code = """
arr = [1, 2, 3]
print(arr[10])  # IndexError
"""
    res = sandbox_service.execute_python(code=code)
    assert res.status == ExecutionStatus.RUNTIME_ERROR
    assert res.exit_code != 0
    assert "IndexError" in res.stderr


def test_python_timeout():
    code = """
while True:
    pass
"""
    res = sandbox_service.execute_python(code=code, timeout=1.0)
    assert res.status == ExecutionStatus.TIMEOUT
    assert res.timed_out is True
    assert "timed out" in res.stderr.lower()


def test_output_comparison_exact():
    comp = sandbox_service.compare_outputs("42\n", "42\n")
    assert comp is not None
    assert comp.is_match is True
    assert comp.is_exact_match is True
    assert comp.is_formatting_difference_only is False


def test_output_comparison_formatting_difference():
    # Extra trailing spaces or trailing newlines
    comp = sandbox_service.compare_outputs("42   \n", "42")
    assert comp is not None
    assert comp.is_match is True
    assert comp.is_exact_match is False
    assert comp.is_formatting_difference_only is True


def test_output_comparison_mismatch():
    comp = sandbox_service.compare_outputs("40\n", "42\n")
    assert comp is not None
    assert comp.is_match is False
    assert comp.is_exact_match is False
    assert "mismatch" in comp.details.lower()


@pytest.mark.skipif(not sandbox_service.is_cpp_available(), reason="g++ compiler not installed")
def test_cpp_successful_execution():
    code = """
#include <iostream>
using namespace std;

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << (a * b) << endl;
    }
    return 0;
}
"""
    res = sandbox_service.execute_cpp(
        code=code,
        custom_input="6 7\n",
        expected_output="42\n",
    )
    assert res.status == ExecutionStatus.SUCCESS
    assert res.exit_code == 0
    assert res.stdout.strip() == "42"
    assert res.comparison is not None
    assert res.comparison.is_match is True


@pytest.mark.skipif(not sandbox_service.is_cpp_available(), reason="g++ compiler not installed")
def test_cpp_compilation_error():
    code = """
#include <iostream>
int main() {
    this_is_an_invalid_token_here();
    return 0;
}
"""
    res = sandbox_service.execute_cpp(code=code)
    assert res.status == ExecutionStatus.COMPILATION_ERROR
    assert res.exit_code != 0
    assert len(res.stderr) > 0
