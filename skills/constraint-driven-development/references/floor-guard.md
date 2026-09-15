# Floor guard：参考实现

`CONSTRAINTS.md` 里每个带编号的维度都对应一个事实标准工具（Step 4）。**floor** 没有：它是一个针对 Step 6 五个动作的 diff-scoped 检查，而如果没有一个随附的参考实现，每个 agent 都会自造一套，于是两次运行（或者一个 Python 仓库和一个 Go 仓库）就会产出两个不同的 guard。这正是本 skill 存在的意义所在——消除这种非确定性。

这就是那个参考实现。把 patterns 适配到你的技术栈；契约必须保持一模一样。

## 契约

- **输入：** merge base 与工作区（working tree）之间的 diff（*新增*和*删除*的行，外加 untracked 文件）。只读 `git diff` 的 guard 会漏掉新文件和已 staged 但未提交的改动。
- **检测 Step 6 的五个动作：** `CONSTRAINTS.md` 中被削弱的阈值、被改简单的测试（`.skip`、被删的测试文件、从留下的测试里移除的断言）、被静默的 checker（新增的抑制注释）、未完成的工作（stub 或空 `catch`）、新增的 Exceptions 行。
- **退出码：** `0` 干净，`1` 至少一个 floor 违规（阻塞该变更），`2` guard 无法运行（没有 merge base、不是 git 仓库）。绝不要让 `2` 被读成 `0`。
- **报告规则和位置，绝不报告被匹配到的 secret 值。** Redaction 不是可选的（Step 4）。
- **收紧是无声的，放松是响亮的：** 只呈现已知会降低质量线的动作。

## 参考实现（Node，patterns 基本与技术栈无关）

```js
#!/usr/bin/env node
// floor-guard.mjs — diff-scoped enforcement of the CONSTRAINTS.md floor.
// Usage: node floor-guard.mjs [--base <ref>]   (default base: origin/main)
import { execFileSync } from 'node:child_process';

const base = (() => {
  const i = process.argv.indexOf('--base');
  return i > -1 ? process.argv[i + 1] : 'origin/main';
})();

const git = (args) => {
  try { return execFileSync('git', args, { encoding: 'utf8' }); }
  catch { return null; }
};

// Merge base; bail to exit 2 rather than pretending a shallow/rootless clone is clean.
const mergeBase = git(['merge-base', base, 'HEAD'])?.trim();
if (!mergeBase) { console.error('floor-guard: no merge base against ' + base); process.exit(2); }

// Unified diff plus untracked files (git diff alone cannot see new files).
const tracked = git(['diff', '--unified=0', mergeBase, '--']) ?? '';
const untracked = (git(['ls-files', '--others', '--exclude-standard']) ?? '')
  .split('\n').filter(Boolean)
  .map((f) => git(['diff', '--no-index', '--unified=0', '/dev/null', f]) ?? '')
  .join('\n');
const diff = tracked + '\n' + untracked;

const added = [], removed = [];
let file = '';
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ ')) file = line.slice(6);
  else if (line.startsWith('+') && !line.startsWith('+++')) added.push({ file, text: line.slice(1) });
  else if (line.startsWith('-') && !line.startsWith('---')) removed.push({ file, text: line.slice(1) });
}

const findings = [];
const flag = (rule, f, text) => findings.push({ rule, file: f, text: text.trim().slice(0, 120) });

// 1. Silenced checker — extend this list for your ecosystem.
const SUPPRESSIONS = /@ts-ignore|@ts-nocheck|eslint-disable|biome-ignore|# *noqa|# *type: *ignore|istanbul ignore|nosemgrep|gitleaks:allow|Stryker disable/;
// 4. Unfinished work.
const STUBS = /throw new (Error|NotImplemented).*[Nn]ot implemented|catch\s*\(\w*\)\s*\{\s*\}|catch\s*\{\s*\}|\bTODO\b|\bpass\s*# *stub/;
// 2. A test made easier (added skips).
const SKIPS = /\.(skip|todo)\b|\bxit\(|\bxdescribe\(|@pytest\.mark\.skip|t\.Skip\(/;

for (const { file, text } of added) {
  if (SUPPRESSIONS.test(text)) flag('silenced-checker', file, text);
  if (STUBS.test(text)) flag('unfinished-work', file, text);
  if (SKIPS.test(text)) flag('test-made-easier', file, text);
  if (/CONSTRAINTS\.md$/.test(file) && /^\| *(W|E)\d+ *\|/.test(text)) flag('new-exception', file, text);
}

// 2b. Assertion removed from a test file that still exists.
for (const { file, text } of removed) {
  if (/\.(test|spec)\.|_test\.|test_/.test(file) && /\b(expect|assert|should)\b/.test(text)) {
    flag('assertion-removed', file, text);
  }
}

// 1b/2c. Weakened threshold: a number in CONSTRAINTS.md that went down, or a floor bullet deleted.
const nums = (s) => (s.match(/\d+(\.\d+)?/g) || []).map(Number);
const removedConstraints = removed.filter((l) => /CONSTRAINTS\.md$/.test(l.file));
const addedConstraints = added.filter((l) => /CONSTRAINTS\.md$/.test(l.file));
for (const r of removedConstraints) {
  const a = addedConstraints.find((x) => x.text.split(/[|:]/)[0] === r.text.split(/[|:]/)[0]);
  if (a && nums(a.text).some((n, i) => nums(r.text)[i] !== undefined && n < nums(r.text)[i])) {
    flag('threshold-lowered', r.file, r.text + '  ->  ' + a.text);
  }
}

if (findings.length === 0) { console.log('floor-guard: clean'); process.exit(0); }
console.error('floor-guard: ' + findings.length + ' floor violation(s):');
for (const f of findings) console.error(`  [${f.rule}] ${f.file}: ${f.text}`);
console.error('\nEach is a move that lowers the bar. Fix the code, or route it through a tracked exception.');
process.exit(1);
```

## 如何适配它

- **Patterns 是唯一与技术栈相关的部分。** 把你的语言的抑制注释和 stub 形式加进那三个正则；diff 管道、CONSTRAINTS.md 检查和退出码原样保留。
- **一个 `.constraintsignore`**（一行一个 glob）允许你豁免 guard 本会标记的某个路径；在标记之前把每条新增行所属的文件与它比对，这样真正的例外是一个被追踪的文件，而不是一条被放松的规则。
- **这是一个起点，不是一个成品工具。** 它是有意做成 regex 浅层的：它抓的是 agent 实际会做的“通往绿色的最便宜的路”的动作，而不是一个蓄意隐藏变更的人。对一个在每个 diff 上运行的检查来说，这是正确的取舍。当你超出它的能力时，迁移到真正的 runner（升级路径第 3 级）。
