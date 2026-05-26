import { describe, it, expect, vi } from 'vitest'
import { GitExecutor } from './GitExecutor'

describe('GitExecutor.parsePorcelainStatus', () => {
  it('should parse simple modified files', () => {
    const output = ' M file1.txt\nM  file2.txt\nMM file3.txt'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(3)
    
    expect(result[0]).toEqual({
      path: 'file1.txt',
      stagedStatus: 'none',
      unstagedStatus: 'modified',
      isStaged: false,
      oldPath: undefined
    })
    
    expect(result[1]).toEqual({
      path: 'file2.txt',
      stagedStatus: 'modified',
      unstagedStatus: 'none',
      isStaged: true,
      oldPath: undefined
    })

    expect(result[2]).toEqual({
      path: 'file3.txt',
      stagedStatus: 'modified',
      unstagedStatus: 'modified',
      isStaged: true,
      oldPath: undefined
    })
  })

  it('should parse added and untracked files', () => {
    const output = 'A  new_staged.js\n?? untracked.md'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(2)
    
    expect(result[0].path).toBe('new_staged.js')
    expect(result[0].stagedStatus).toBe('added')
    expect(result[0].isStaged).toBe(true)
    
    expect(result[1].path).toBe('untracked.md')
    expect(result[1].unstagedStatus).toBe('untracked')
    expect(result[1].isStaged).toBe(false)
  })

  it('should parse deleted files', () => {
    const output = ' D deleted_unstaged.txt\nD  deleted_staged.txt'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(2)
    expect(result[0].stagedStatus).toBe('none')
    expect(result[0].unstagedStatus).toBe('deleted')
    expect(result[1].stagedStatus).toBe('deleted')
    expect(result[1].unstagedStatus).toBe('none')
  })

  it('should parse renames', () => {
    const output = 'R  old.txt -> new.txt'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      path: 'new.txt',
      oldPath: 'old.txt',
      stagedStatus: 'renamed',
      unstagedStatus: 'none',
      isStaged: true
    })
  })

  it('should handle filenames with spaces', () => {
    const output = ' M "file with spaces.txt"\n?? "new file.md"'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('file with spaces.txt')
    expect(result[1].path).toBe('new file.md')
  })

  it('should handle complex renames with spaces and quotes', () => {
    const output = 'R  "old name.txt" -> "new name.txt"'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('new name.txt')
    expect(result[0].oldPath).toBe('old name.txt')
    expect(result[0].stagedStatus).toBe('renamed')
  })

  it('should handle renames where " -> " is part of the filename', () => {
    const output = 'R  "a -> b.txt" -> "c -> d.txt"'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('c -> d.txt')
    expect(result[0].oldPath).toBe('a -> b.txt')
  })

  it('should handle UTF-8 octal escapes', () => {
    // "m\303\244stare" is "mästare" in Git octal
    const output = '?? "m\\303\\244stare.txt"'
    const result = GitExecutor.parsePorcelainStatus(output)
    
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('mästare.txt')
  })
})

describe('GitExecutor.parseDiff', () => {
  it('should parse a simple diff', () => {
    const diffOutput = `diff --git a/test.txt b/test.txt
index e69de29..d00491f 100644
--- a/test.txt
+++ b/test.txt
@@ -1 +1,2 @@
-old line
+new line
+another line
 context line`
    
    const result = (GitExecutor as any).parseDiff(diffOutput)
    
    expect(result).toHaveLength(5)
    expect(result[0].type).toBe('header')
    expect(result[1]).toEqual({ content: '-old line', type: 'deletion', oldLineNumber: 1 })
    expect(result[2]).toEqual({ content: '+new line', type: 'addition', lineNumber: 1 })
    expect(result[3]).toEqual({ content: '+another line', type: 'addition', lineNumber: 2 })
    expect(result[4]).toEqual({ content: ' context line', type: 'context', lineNumber: 3, oldLineNumber: 2 })
  })

  it('should parse a diff with multiple chunks', () => {
    const diffOutput = `@@ -1,2 +1,2 @@
 line1
-line2
+line2 modified
@@ -10,3 +10,4 @@
 line10
+line11
 line12
 line13`

    const result = (GitExecutor as any).parseDiff(diffOutput)
    expect(result.filter(l => l.type === 'header')).toHaveLength(2)
    
    const secondChunkHeader = result.find(l => l.content.includes('@@ -10,3 +10,4 @@'))
    const nextLine = result[result.indexOf(secondChunkHeader) + 1]
    expect(nextLine).toEqual({ content: ' line10', type: 'context', lineNumber: 10, oldLineNumber: 10 })
  })
})

describe('GitExecutor mutations', () => {
  it('should call git add with correct arguments including separator', async () => {
    const executor = GitExecutor.getInstance()
    const executeSpy = vi.spyOn(executor, 'execute').mockResolvedValue({ stdout: '', stderr: '' })
    
    await executor.add('/repo', ['file1.js', 'file2.js'])
    
    expect(executeSpy).toHaveBeenCalledWith('/repo', ['add', '--', 'file1.js', 'file2.js'])
    executeSpy.mockRestore()
  })

  it('should call git reset with correct arguments including separator', async () => {
    const executor = GitExecutor.getInstance()
    const executeSpy = vi.spyOn(executor, 'execute').mockResolvedValue({ stdout: '', stderr: '' })
    
    await executor.reset('/repo', ['file1.js'])
    
    expect(executeSpy).toHaveBeenCalledWith('/repo', ['reset', 'HEAD', '--', 'file1.js'])
    executeSpy.mockRestore()
  })
})
