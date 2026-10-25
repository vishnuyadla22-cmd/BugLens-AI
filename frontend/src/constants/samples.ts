import type { SampleProblem } from '../types';

export const SAMPLE_PROBLEMS: SampleProblem[] = [
  {
    id: 'py-two-sum-bug',
    title: 'Python: Two Sum (Dictionary Lookup Bug)',
    language: 'python',
    mode: 'find_error',
    description: 'A classic Two Sum attempt that encounters a KeyError and returns duplicate elements.',
    problem_statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Input Format:
Line 1: Space-separated integers representing the array
Line 2: Single integer target

Example:
Input:
2 7 11 15
9
Output:
0 1`,
    code: `def two_sum():
    nums = list(map(int, input().split()))
    target = int(input())
    
    seen = {}
    for i in range(len(nums)):
        seen[nums[i]] = i
        
    for i in range(len(nums)):
        diff = target - nums[i]
        # BUG: This will return the current element twice if target == 2 * nums[i]
        # and doesn't handle single-pass lookup safely.
        if diff in seen:
            return [i, seen[diff]]
            
    return []

if __name__ == "__main__":
    result = two_sum()
    print(" ".join(map(str, result)))`,
    custom_input: `3 2 4\n6`,
    expected_output: `1 2`,
  },
  {
    id: 'py-infinite-fib',
    title: 'Python: Recursive Fibonacci (TLE / Missing Base Case)',
    language: 'python',
    mode: 'why_wrong',
    description: 'Recursive computation without memoization or proper base case handling for 0.',
    problem_statement: `Compute the N-th Fibonacci number where F(0) = 0, F(1) = 1, and F(N) = F(N-1) + F(N-2).
The algorithm must handle inputs up to N = 50 efficiently within 1.0 second.

Input Format:
Single integer N (0 <= N <= 50)

Example:
Input: 10
Output: 55`,
    code: `import sys

def fib(n):
    # BUG: Fails for n = 0, causes negative recursion recursion depth error!
    if n == 1:
        return 1
    if n == 2:
        return 1
    return fib(n - 1) + fib(n - 2)

if __name__ == "__main__":
    lines = sys.stdin.read().split()
    if lines:
        n = int(lines[0])
        print(fib(n))`,
    custom_input: `0`,
    expected_output: `0`,
  },
  {
    id: 'cpp-binary-search-bug',
    title: 'C++: Binary Search (Integer Overflow & Off-by-One)',
    language: 'cpp',
    mode: 'find_error',
    description: 'Binary search with integer overflow in midpoint calculation and boundary update bug.',
    problem_statement: `Given a sorted array of distinct integers in ascending order and a target value, return the index if the target is found. If not, return -1.
You must write an algorithm with O(log n) runtime complexity.

Input Format:
Line 1: Number of elements N
Line 2: N space-separated integers
Line 3: Target value to search

Example:
Input:
5
-1 0 3 5 9
9
Output:
4`,
    code: `#include <iostream>
#include <vector>

using namespace std;

int search(const vector<int>& nums, int target) {
    int low = 0;
    int high = nums.size(); // BUG: high should be nums.size() - 1 or adjust while condition
    
    while (low < high) {
        // BUG: (low + high) can overflow if integers are large!
        int mid = (low + high) / 2;
        
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid; // BUG: Infinite loop when high - low == 1
        } else {
            high = mid - 1;
        }
    }
    
    return -1;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) {
        cin >> nums[i];
    }
    int target;
    cin >> target;
    cout << search(nums, target) << endl;
    return 0;
}`,
    custom_input: `5\n-1 0 3 5 9\n9`,
    expected_output: `4`,
  },
  {
    id: 'cpp-palindrome-crash',
    title: 'C++: Palindrome Check (Segmentation Fault / Vector Bounds)',
    language: 'cpp',
    mode: 'why_wrong',
    description: 'Checks whether an input string is a palindrome but crashes on empty strings or single chars due to unsigned underflow.',
    problem_statement: `Determine if a given string s is a palindrome, considering only alphanumeric characters and ignoring cases.

Input Format:
A single line string.

Example:
Input: A man, a plan, a canal: Panama
Output: true`,
    code: `#include <iostream>
#include <string>
#include <cctype>

using namespace std;

bool isPalindrome(string s) {
    int left = 0;
    // BUG: If s.length() is 0, s.length() - 1 underflows on unsigned size_t if not cast properly!
    int right = s.length() - 1;
    
    while (left < right) {
        while (left < right && !isalnum(s[left])) {
            left++;
        }
        while (left < right && !isalnum(s[right])) {
            right--;
        }
        // BUG: Direct case comparison without tolower() causes mismatches on uppercase vs lowercase letters
        if (s[left] != s[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}`,
    custom_input: `A man, a plan, a canal: Panama`,
    expected_output: `true`,
  },
  {
    id: 'cpp-valid-clean',
    title: 'C++: Valid Solution (No Obvious Issue)',
    language: 'cpp',
    mode: 'why_wrong',
    description: 'Optimal solution using standard library sorting to verify "No Obvious Issue Found" analysis.',
    problem_statement: `Given an array of integers, sort the array in non-decreasing order and output the elements separated by spaces.

Input Format:
Line 1: Integer N
Line 2: N space-separated integers`,
    code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (cin >> n) {
        vector<int> a(n);
        for (int i = 0; i < n; ++i) {
            cin >> a[i];
        }
        sort(a.begin(), a.end());
        for (int i = 0; i < n; ++i) {
            cout << a[i] << (i == n - 1 ? "" : " ");
        }
        cout << "\n";
    }
    return 0;
}`,
    custom_input: `5\n5 2 9 1 5`,
    expected_output: `1 2 5 5 9`,
  },
];
