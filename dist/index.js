module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(676);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 9:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __webpack_require__(87);
const events = __webpack_require__(614);
const child = __webpack_require__(129);
/* eslint-disable @typescript-eslint/unbound-method */
const IS_WINDOWS = process.platform === 'win32';
/*
 * Class for running command line tools. Handles quoting and arg parsing in a platform agnostic way.
 */
class ToolRunner extends events.EventEmitter {
    constructor(toolPath, args, options) {
        super();
        if (!toolPath) {
            throw new Error("Parameter 'toolPath' cannot be null or empty.");
        }
        this.toolPath = toolPath;
        this.args = args || [];
        this.options = options || {};
    }
    _debug(message) {
        if (this.options.listeners && this.options.listeners.debug) {
            this.options.listeners.debug(message);
        }
    }
    _getCommandString(options, noPrefix) {
        const toolPath = this._getSpawnFileName();
        const args = this._getSpawnArgs(options);
        let cmd = noPrefix ? '' : '[command]'; // omit prefix when piped to a second tool
        if (IS_WINDOWS) {
            // Windows + cmd file
            if (this._isCmdFile()) {
                cmd += toolPath;
                for (const a of args) {
                    cmd += ` ${a}`;
                }
            }
            // Windows + verbatim
            else if (options.windowsVerbatimArguments) {
                cmd += `"${toolPath}"`;
                for (const a of args) {
                    cmd += ` ${a}`;
                }
            }
            // Windows (regular)
            else {
                cmd += this._windowsQuoteCmdArg(toolPath);
                for (const a of args) {
                    cmd += ` ${this._windowsQuoteCmdArg(a)}`;
                }
            }
        }
        else {
            // OSX/Linux - this can likely be improved with some form of quoting.
            // creating processes on Unix is fundamentally different than Windows.
            // on Unix, execvp() takes an arg array.
            cmd += toolPath;
            for (const a of args) {
                cmd += ` ${a}`;
            }
        }
        return cmd;
    }
    _processLineBuffer(data, strBuffer, onLine) {
        try {
            let s = strBuffer + data.toString();
            let n = s.indexOf(os.EOL);
            while (n > -1) {
                const line = s.substring(0, n);
                onLine(line);
                // the rest of the string ...
                s = s.substring(n + os.EOL.length);
                n = s.indexOf(os.EOL);
            }
            strBuffer = s;
        }
        catch (err) {
            // streaming lines to console is best effort.  Don't fail a build.
            this._debug(`error processing line. Failed with error ${err}`);
        }
    }
    _getSpawnFileName() {
        if (IS_WINDOWS) {
            if (this._isCmdFile()) {
                return process.env['COMSPEC'] || 'cmd.exe';
            }
        }
        return this.toolPath;
    }
    _getSpawnArgs(options) {
        if (IS_WINDOWS) {
            if (this._isCmdFile()) {
                let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
                for (const a of this.args) {
                    argline += ' ';
                    argline += options.windowsVerbatimArguments
                        ? a
                        : this._windowsQuoteCmdArg(a);
                }
                argline += '"';
                return [argline];
            }
        }
        return this.args;
    }
    _endsWith(str, end) {
        return str.endsWith(end);
    }
    _isCmdFile() {
        const upperToolPath = this.toolPath.toUpperCase();
        return (this._endsWith(upperToolPath, '.CMD') ||
            this._endsWith(upperToolPath, '.BAT'));
    }
    _windowsQuoteCmdArg(arg) {
        // for .exe, apply the normal quoting rules that libuv applies
        if (!this._isCmdFile()) {
            return this._uvQuoteCmdArg(arg);
        }
        // otherwise apply quoting rules specific to the cmd.exe command line parser.
        // the libuv rules are generic and are not designed specifically for cmd.exe
        // command line parser.
        //
        // for a detailed description of the cmd.exe command line parser, refer to
        // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912
        // need quotes for empty arg
        if (!arg) {
            return '""';
        }
        // determine whether the arg needs to be quoted
        const cmdSpecialChars = [
            ' ',
            '\t',
            '&',
            '(',
            ')',
            '[',
            ']',
            '{',
            '}',
            '^',
            '=',
            ';',
            '!',
            "'",
            '+',
            ',',
            '`',
            '~',
            '|',
            '<',
            '>',
            '"'
        ];
        let needsQuotes = false;
        for (const char of arg) {
            if (cmdSpecialChars.some(x => x === char)) {
                needsQuotes = true;
                break;
            }
        }
        // short-circuit if quotes not needed
        if (!needsQuotes) {
            return arg;
        }
        // the following quoting rules are very similar to the rules that by libuv applies.
        //
        // 1) wrap the string in quotes
        //
        // 2) double-up quotes - i.e. " => ""
        //
        //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
        //    doesn't work well with a cmd.exe command line.
        //
        //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
        //    for example, the command line:
        //          foo.exe "myarg:""my val"""
        //    is parsed by a .NET console app into an arg array:
        //          [ "myarg:\"my val\"" ]
        //    which is the same end result when applying libuv quoting rules. although the actual
        //    command line from libuv quoting rules would look like:
        //          foo.exe "myarg:\"my val\""
        //
        // 3) double-up slashes that precede a quote,
        //    e.g.  hello \world    => "hello \world"
        //          hello\"world    => "hello\\""world"
        //          hello\\"world   => "hello\\\\""world"
        //          hello world\    => "hello world\\"
        //
        //    technically this is not required for a cmd.exe command line, or the batch argument parser.
        //    the reasons for including this as a .cmd quoting rule are:
        //
        //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
        //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
        //
        //    b) it's what we've been doing previously (by deferring to node default behavior) and we
        //       haven't heard any complaints about that aspect.
        //
        // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
        // escaped when used on the command line directly - even though within a .cmd file % can be escaped
        // by using %%.
        //
        // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
        // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
        //
        // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
        // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
        // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
        // to an external program.
        //
        // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
        // % can be escaped within a .cmd file.
        let reverse = '"';
        let quoteHit = true;
        for (let i = arg.length; i > 0; i--) {
            // walk the string in reverse
            reverse += arg[i - 1];
            if (quoteHit && arg[i - 1] === '\\') {
                reverse += '\\'; // double the slash
            }
            else if (arg[i - 1] === '"') {
                quoteHit = true;
                reverse += '"'; // double the quote
            }
            else {
                quoteHit = false;
            }
        }
        reverse += '"';
        return reverse
            .split('')
            .reverse()
            .join('');
    }
    _uvQuoteCmdArg(arg) {
        // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
        // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
        // is used.
        //
        // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
        // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
        // pasting copyright notice from Node within this function:
        //
        //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
        //
        //      Permission is hereby granted, free of charge, to any person obtaining a copy
        //      of this software and associated documentation files (the "Software"), to
        //      deal in the Software without restriction, including without limitation the
        //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
        //      sell copies of the Software, and to permit persons to whom the Software is
        //      furnished to do so, subject to the following conditions:
        //
        //      The above copyright notice and this permission notice shall be included in
        //      all copies or substantial portions of the Software.
        //
        //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
        //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
        //      IN THE SOFTWARE.
        if (!arg) {
            // Need double quotation for empty argument
            return '""';
        }
        if (!arg.includes(' ') && !arg.includes('\t') && !arg.includes('"')) {
            // No quotation needed
            return arg;
        }
        if (!arg.includes('"') && !arg.includes('\\')) {
            // No embedded double quotes or backslashes, so I can just wrap
            // quote marks around the whole thing.
            return `"${arg}"`;
        }
        // Expected input/output:
        //   input : hello"world
        //   output: "hello\"world"
        //   input : hello""world
        //   output: "hello\"\"world"
        //   input : hello\world
        //   output: hello\world
        //   input : hello\\world
        //   output: hello\\world
        //   input : hello\"world
        //   output: "hello\\\"world"
        //   input : hello\\"world
        //   output: "hello\\\\\"world"
        //   input : hello world\
        //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
        //                             but it appears the comment is wrong, it should be "hello world\\"
        let reverse = '"';
        let quoteHit = true;
        for (let i = arg.length; i > 0; i--) {
            // walk the string in reverse
            reverse += arg[i - 1];
            if (quoteHit && arg[i - 1] === '\\') {
                reverse += '\\';
            }
            else if (arg[i - 1] === '"') {
                quoteHit = true;
                reverse += '\\';
            }
            else {
                quoteHit = false;
            }
        }
        reverse += '"';
        return reverse
            .split('')
            .reverse()
            .join('');
    }
    _cloneExecOptions(options) {
        options = options || {};
        const result = {
            cwd: options.cwd || process.cwd(),
            env: options.env || process.env,
            silent: options.silent || false,
            windowsVerbatimArguments: options.windowsVerbatimArguments || false,
            failOnStdErr: options.failOnStdErr || false,
            ignoreReturnCode: options.ignoreReturnCode || false,
            delay: options.delay || 10000
        };
        result.outStream = options.outStream || process.stdout;
        result.errStream = options.errStream || process.stderr;
        return result;
    }
    _getSpawnOptions(options, toolPath) {
        options = options || {};
        const result = {};
        result.cwd = options.cwd;
        result.env = options.env;
        result['windowsVerbatimArguments'] =
            options.windowsVerbatimArguments || this._isCmdFile();
        if (options.windowsVerbatimArguments) {
            result.argv0 = `"${toolPath}"`;
        }
        return result;
    }
    /**
     * Exec a tool.
     * Output will be streamed to the live console.
     * Returns promise with return code
     *
     * @param     tool     path to tool to exec
     * @param     options  optional exec options.  See ExecOptions
     * @returns   number
     */
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._debug(`exec tool: ${this.toolPath}`);
                this._debug('arguments:');
                for (const arg of this.args) {
                    this._debug(`   ${arg}`);
                }
                const optionsNonNull = this._cloneExecOptions(this.options);
                if (!optionsNonNull.silent && optionsNonNull.outStream) {
                    optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os.EOL);
                }
                const state = new ExecState(optionsNonNull, this.toolPath);
                state.on('debug', (message) => {
                    this._debug(message);
                });
                const fileName = this._getSpawnFileName();
                const cp = child.spawn(fileName, this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(this.options, fileName));
                const stdbuffer = '';
                if (cp.stdout) {
                    cp.stdout.on('data', (data) => {
                        if (this.options.listeners && this.options.listeners.stdout) {
                            this.options.listeners.stdout(data);
                        }
                        if (!optionsNonNull.silent && optionsNonNull.outStream) {
                            optionsNonNull.outStream.write(data);
                        }
                        this._processLineBuffer(data, stdbuffer, (line) => {
                            if (this.options.listeners && this.options.listeners.stdline) {
                                this.options.listeners.stdline(line);
                            }
                        });
                    });
                }
                const errbuffer = '';
                if (cp.stderr) {
                    cp.stderr.on('data', (data) => {
                        state.processStderr = true;
                        if (this.options.listeners && this.options.listeners.stderr) {
                            this.options.listeners.stderr(data);
                        }
                        if (!optionsNonNull.silent &&
                            optionsNonNull.errStream &&
                            optionsNonNull.outStream) {
                            const s = optionsNonNull.failOnStdErr
                                ? optionsNonNull.errStream
                                : optionsNonNull.outStream;
                            s.write(data);
                        }
                        this._processLineBuffer(data, errbuffer, (line) => {
                            if (this.options.listeners && this.options.listeners.errline) {
                                this.options.listeners.errline(line);
                            }
                        });
                    });
                }
                cp.on('error', (err) => {
                    state.processError = err.message;
                    state.processExited = true;
                    state.processClosed = true;
                    state.CheckComplete();
                });
                cp.on('exit', (code) => {
                    state.processExitCode = code;
                    state.processExited = true;
                    this._debug(`Exit code ${code} received from tool '${this.toolPath}'`);
                    state.CheckComplete();
                });
                cp.on('close', (code) => {
                    state.processExitCode = code;
                    state.processExited = true;
                    state.processClosed = true;
                    this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
                    state.CheckComplete();
                });
                state.on('done', (error, exitCode) => {
                    if (stdbuffer.length > 0) {
                        this.emit('stdline', stdbuffer);
                    }
                    if (errbuffer.length > 0) {
                        this.emit('errline', errbuffer);
                    }
                    cp.removeAllListeners();
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(exitCode);
                    }
                });
            });
        });
    }
}
exports.ToolRunner = ToolRunner;
/**
 * Convert an arg string to an array of args. Handles escaping
 *
 * @param    argString   string of arguments
 * @returns  string[]    array of arguments
 */
function argStringToArray(argString) {
    const args = [];
    let inQuotes = false;
    let escaped = false;
    let arg = '';
    function append(c) {
        // we only escape double quotes.
        if (escaped && c !== '"') {
            arg += '\\';
        }
        arg += c;
        escaped = false;
    }
    for (let i = 0; i < argString.length; i++) {
        const c = argString.charAt(i);
        if (c === '"') {
            if (!escaped) {
                inQuotes = !inQuotes;
            }
            else {
                append(c);
            }
            continue;
        }
        if (c === '\\' && escaped) {
            append(c);
            continue;
        }
        if (c === '\\' && inQuotes) {
            escaped = true;
            continue;
        }
        if (c === ' ' && !inQuotes) {
            if (arg.length > 0) {
                args.push(arg);
                arg = '';
            }
            continue;
        }
        append(c);
    }
    if (arg.length > 0) {
        args.push(arg.trim());
    }
    return args;
}
exports.argStringToArray = argStringToArray;
class ExecState extends events.EventEmitter {
    constructor(options, toolPath) {
        super();
        this.processClosed = false; // tracks whether the process has exited and stdio is closed
        this.processError = '';
        this.processExitCode = 0;
        this.processExited = false; // tracks whether the process has exited
        this.processStderr = false; // tracks whether stderr was written to
        this.delay = 10000; // 10 seconds
        this.done = false;
        this.timeout = null;
        if (!toolPath) {
            throw new Error('toolPath must not be empty');
        }
        this.options = options;
        this.toolPath = toolPath;
        if (options.delay) {
            this.delay = options.delay;
        }
    }
    CheckComplete() {
        if (this.done) {
            return;
        }
        if (this.processClosed) {
            this._setResult();
        }
        else if (this.processExited) {
            this.timeout = setTimeout(ExecState.HandleTimeout, this.delay, this);
        }
    }
    _debug(message) {
        this.emit('debug', message);
    }
    _setResult() {
        // determine whether there is an error
        let error;
        if (this.processExited) {
            if (this.processError) {
                error = new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`);
            }
            else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
                error = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
            }
            else if (this.processStderr && this.options.failOnStdErr) {
                error = new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`);
            }
        }
        // clear the timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.done = true;
        this.emit('done', error, this.processExitCode);
    }
    static HandleTimeout(state) {
        if (state.done) {
            return;
        }
        if (!state.processClosed && state.processExited) {
            const message = `The STDIO streams did not close within ${state.delay /
                1000} seconds of the exit event from process '${state.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
            state._debug(message);
        }
        state._setResult();
    }
}
//# sourceMappingURL=toolrunner.js.map

/***/ }),

/***/ 19:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Range {
  static copy(orig) {
    return new Range(orig.start, orig.end);
  }

  constructor(start, end) {
    this.start = start;
    this.end = end || start;
  }

  isEmpty() {
    return typeof this.start !== 'number' || !this.end || this.end <= this.start;
  }
  /**
   * Set `origStart` and `origEnd` to point to the original source range for
   * this node, which may differ due to dropped CR characters.
   *
   * @param {number[]} cr - Positions of dropped CR characters
   * @param {number} offset - Starting index of `cr` from the last call
   * @returns {number} - The next offset, matching the one found for `origStart`
   */


  setOrigRange(cr, offset) {
    const {
      start,
      end
    } = this;

    if (cr.length === 0 || end <= cr[0]) {
      this.origStart = start;
      this.origEnd = end;
      return offset;
    }

    let i = offset;

    while (i < cr.length) {
      if (cr[i] > start) break;else ++i;
    }

    this.origStart = start + i;
    const nextOffset = i;

    while (i < cr.length) {
      // if end was at \n, it should now be at \r
      if (cr[i] >= end) break;else ++i;
    }

    this.origEnd = end + i;
    return nextOffset;
  }

}

exports.default = Range;

/***/ }),

/***/ 24:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Chomp = void 0;

var _constants = __webpack_require__(49);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Chomp = {
  CLIP: 'CLIP',
  KEEP: 'KEEP',
  STRIP: 'STRIP'
};
exports.Chomp = Chomp;

class BlockValue extends _Node.default {
  constructor(type, props) {
    super(type, props);
    this.blockIndent = null;
    this.chomping = Chomp.CLIP;
    this.header = null;
  }

  get includesTrailingLines() {
    return this.chomping === Chomp.KEEP;
  }

  get strValue() {
    if (!this.valueRange || !this.context) return null;
    let {
      start,
      end
    } = this.valueRange;
    const {
      indent,
      src
    } = this.context;
    if (this.valueRange.isEmpty()) return '';
    let lastNewLine = null;
    let ch = src[end - 1];

    while (ch === '\n' || ch === '\t' || ch === ' ') {
      end -= 1;

      if (end <= start) {
        if (this.chomping === Chomp.KEEP) break;else return '';
      }

      if (ch === '\n') lastNewLine = end;
      ch = src[end - 1];
    }

    let keepStart = end + 1;

    if (lastNewLine) {
      if (this.chomping === Chomp.KEEP) {
        keepStart = lastNewLine;
        end = this.valueRange.end;
      } else {
        end = lastNewLine;
      }
    }

    const bi = indent + this.blockIndent;
    const folded = this.type === _constants.Type.BLOCK_FOLDED;
    let atStart = true;
    let str = '';
    let sep = '';
    let prevMoreIndented = false;

    for (let i = start; i < end; ++i) {
      for (let j = 0; j < bi; ++j) {
        if (src[i] !== ' ') break;
        i += 1;
      }

      const ch = src[i];

      if (ch === '\n') {
        if (sep === '\n') str += '\n';else sep = '\n';
      } else {
        const lineEnd = _Node.default.endOfLine(src, i);

        const line = src.slice(i, lineEnd);
        i = lineEnd;

        if (folded && (ch === ' ' || ch === '\t') && i < keepStart) {
          if (sep === ' ') sep = '\n';else if (!prevMoreIndented && !atStart && sep === '\n') sep = '\n\n';
          str += sep + line; //+ ((lineEnd < end && src[lineEnd]) || '')

          sep = lineEnd < end && src[lineEnd] || '';
          prevMoreIndented = true;
        } else {
          str += sep + line;
          sep = folded && i < keepStart ? ' ' : '\n';
          prevMoreIndented = false;
        }

        if (atStart && line !== '') atStart = false;
      }
    }

    return this.chomping === Chomp.STRIP ? str : str + '\n';
  }

  parseBlockHeader(start) {
    const {
      src
    } = this.context;
    let offset = start + 1;
    let bi = '';

    while (true) {
      const ch = src[offset];

      switch (ch) {
        case '-':
          this.chomping = Chomp.STRIP;
          break;

        case '+':
          this.chomping = Chomp.KEEP;
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          bi += ch;
          break;

        default:
          this.blockIndent = Number(bi) || null;
          this.header = new _Range.default(start, offset);
          return offset;
      }

      offset += 1;
    }
  }

  parseBlockValue(start) {
    const {
      indent,
      src
    } = this.context;
    let offset = start;
    let valueEnd = start;
    let bi = this.blockIndent ? indent + this.blockIndent - 1 : indent;
    let minBlockIndent = 1;

    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      offset += 1;
      if (_Node.default.atDocumentBoundary(src, offset)) break;

      const end = _Node.default.endOfBlockIndent(src, bi, offset); // should not include tab?


      if (end === null) break;

      if (!this.blockIndent) {
        // no explicit block indent, none yet detected
        const lineIndent = end - (offset + indent);

        if (src[end] !== '\n') {
          // first line with non-whitespace content
          if (lineIndent < minBlockIndent) {
            offset -= 1;
            break;
          }

          this.blockIndent = lineIndent;
          bi = indent + this.blockIndent - 1;
        } else if (lineIndent > minBlockIndent) {
          // empty line with more whitespace
          minBlockIndent = lineIndent;
        }
      }

      if (src[end] === '\n') {
        offset = end;
      } else {
        offset = valueEnd = _Node.default.endOfLine(src, end);
      }
    }

    if (this.chomping !== Chomp.KEEP) {
      offset = src[valueEnd] ? valueEnd + 1 : valueEnd;
    }

    this.valueRange = new _Range.default(start + 1, offset);
    return offset;
  }
  /**
   * Parses a block value from the source
   *
   * Accepted forms are:
   * ```
   * BS
   * block
   * lines
   *
   * BS #comment
   * block
   * lines
   * ```
   * where the block style BS matches the regexp `[|>][-+1-9]*` and block lines
   * are empty or have an indent level greater than `indent`.
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this block
   */


  parse(context, start) {
    this.context = context;
    const {
      src
    } = context;
    let offset = this.parseBlockHeader(start);
    offset = _Node.default.endOfWhiteSpace(src, offset);
    offset = this.parseComment(offset);
    offset = this.parseBlockValue(offset);
    return offset;
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset);
    return this.header ? this.header.setOrigRange(cr, offset) : offset;
  }

}

exports.default = BlockValue;

/***/ }),

/***/ 29:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toJSON = _interopRequireDefault(__webpack_require__(923));

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Published as 'yaml/seq'
function asItemIndex(key) {
  let idx = key instanceof _Scalar.default ? key.value : key;
  if (idx && typeof idx === 'string') idx = Number(idx);
  return Number.isInteger(idx) && idx >= 0 ? idx : null;
}

class YAMLSeq extends _Collection.default {
  add(value) {
    this.items.push(value);
  }

  delete(key) {
    const idx = asItemIndex(key);
    if (typeof idx !== 'number') return false;
    const del = this.items.splice(idx, 1);
    return del.length > 0;
  }

  get(key, keepScalar) {
    const idx = asItemIndex(key);
    if (typeof idx !== 'number') return undefined;
    const it = this.items[idx];
    return !keepScalar && it instanceof _Scalar.default ? it.value : it;
  }

  has(key) {
    const idx = asItemIndex(key);
    return typeof idx === 'number' && idx < this.items.length;
  }

  set(key, value) {
    const idx = asItemIndex(key);
    if (typeof idx !== 'number') throw new Error(`Expected a valid index, not ${key}.`);
    this.items[idx] = value;
  }

  toJSON(_, ctx) {
    const seq = [];
    if (ctx && ctx.onCreate) ctx.onCreate(seq);
    let i = 0;

    for (const item of this.items) seq.push((0, _toJSON.default)(item, String(i++), ctx));

    return seq;
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this);
    return super.toString(ctx, {
      blockItem: n => n.type === 'comment' ? n.str : `- ${n.str}`,
      flowChars: {
        start: '[',
        end: ']'
      },
      isMap: false,
      itemIndent: (ctx.indent || '') + '  '
    }, onComment, onChompKeep);
  }

}

exports.default = YAMLSeq;

/***/ }),

/***/ 41:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLinePos = getLinePos;
exports.getLine = getLine;
exports.getPrettyContext = getPrettyContext;

function findLineStarts(src) {
  const ls = [0];
  let offset = src.indexOf('\n');

  while (offset !== -1) {
    offset += 1;
    ls.push(offset);
    offset = src.indexOf('\n', offset);
  }

  return ls;
}

function getSrcInfo(cst) {
  let lineStarts, src;

  if (typeof cst === 'string') {
    lineStarts = findLineStarts(cst);
    src = cst;
  } else {
    if (Array.isArray(cst)) cst = cst[0];

    if (cst && cst.context) {
      if (!cst.lineStarts) cst.lineStarts = findLineStarts(cst.context.src);
      lineStarts = cst.lineStarts;
      src = cst.context.src;
    }
  }

  return {
    lineStarts,
    src
  };
}
/**
 * @typedef {Object} LinePos - One-indexed position in the source
 * @property {number} line
 * @property {number} col
 */

/**
 * Determine the line/col position matching a character offset.
 *
 * Accepts a source string or a CST document as the second parameter. With
 * the latter, starting indices for lines are cached in the document as
 * `lineStarts: number[]`.
 *
 * Returns a one-indexed `{ line, col }` location if found, or
 * `undefined` otherwise.
 *
 * @param {number} offset
 * @param {string|Document|Document[]} cst
 * @returns {?LinePos}
 */


function getLinePos(offset, cst) {
  if (typeof offset !== 'number' || offset < 0) return null;
  const {
    lineStarts,
    src
  } = getSrcInfo(cst);
  if (!lineStarts || !src || offset > src.length) return null;

  for (let i = 0; i < lineStarts.length; ++i) {
    const start = lineStarts[i];

    if (offset < start) {
      return {
        line: i,
        col: offset - lineStarts[i - 1] + 1
      };
    }

    if (offset === start) return {
      line: i + 1,
      col: 1
    };
  }

  const line = lineStarts.length;
  return {
    line,
    col: offset - lineStarts[line - 1] + 1
  };
}
/**
 * Get a specified line from the source.
 *
 * Accepts a source string or a CST document as the second parameter. With
 * the latter, starting indices for lines are cached in the document as
 * `lineStarts: number[]`.
 *
 * Returns the line as a string if found, or `null` otherwise.
 *
 * @param {number} line One-indexed line number
 * @param {string|Document|Document[]} cst
 * @returns {?string}
 */


function getLine(line, cst) {
  const {
    lineStarts,
    src
  } = getSrcInfo(cst);
  if (!lineStarts || !(line >= 1) || line > lineStarts.length) return null;
  const start = lineStarts[line - 1];
  let end = lineStarts[line]; // undefined for last line; that's ok for slice()

  while (end && end > start && src[end - 1] === '\n') --end;

  return src.slice(start, end);
}
/**
 * Pretty-print the starting line from the source indicated by the range `pos`
 *
 * Trims output to `maxWidth` chars while keeping the starting column visible,
 * using `…` at either end to indicate dropped characters.
 *
 * Returns a two-line string (or `null`) with `\n` as separator; the second line
 * will hold appropriately indented `^` marks indicating the column range.
 *
 * @param {Object} pos
 * @param {LinePos} pos.start
 * @param {LinePos} [pos.end]
 * @param {string|Document|Document[]*} cst
 * @param {number} [maxWidth=80]
 * @returns {?string}
 */


function getPrettyContext({
  start,
  end
}, cst, maxWidth = 80) {
  let src = getLine(start.line, cst);
  if (!src) return null;
  let {
    col
  } = start;

  if (src.length > maxWidth) {
    if (col <= maxWidth - 10) {
      src = src.substr(0, maxWidth - 1) + '…';
    } else {
      const halfWidth = Math.round(maxWidth / 2);
      if (src.length > col + halfWidth) src = src.substr(0, col + halfWidth - 1) + '…';
      col -= src.length - maxWidth;
      src = '…' + src.substr(1 - maxWidth);
    }
  }

  let errLen = 1;
  let errEnd = '';

  if (end) {
    if (end.line === start.line && col + (end.col - start.col) <= maxWidth + 1) {
      errLen = end.col - start.col;
    } else {
      errLen = Math.min(src.length + 1, maxWidth) - col;
      errEnd = '…';
    }
  }

  const offset = col > 1 ? ' '.repeat(col - 1) : '';
  const err = '^'.repeat(errLen);
  return `${src}\n${offset}${err}${errEnd}`;
}

/***/ }),

/***/ 49:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Type = exports.Char = void 0;
const Char = {
  ANCHOR: '&',
  COMMENT: '#',
  TAG: '!',
  DIRECTIVES_END: '-',
  DOCUMENT_END: '.'
};
exports.Char = Char;
const Type = {
  ALIAS: 'ALIAS',
  BLANK_LINE: 'BLANK_LINE',
  BLOCK_FOLDED: 'BLOCK_FOLDED',
  BLOCK_LITERAL: 'BLOCK_LITERAL',
  COMMENT: 'COMMENT',
  DIRECTIVE: 'DIRECTIVE',
  DOCUMENT: 'DOCUMENT',
  FLOW_MAP: 'FLOW_MAP',
  FLOW_SEQ: 'FLOW_SEQ',
  MAP: 'MAP',
  MAP_KEY: 'MAP_KEY',
  MAP_VALUE: 'MAP_VALUE',
  PLAIN: 'PLAIN',
  QUOTE_DOUBLE: 'QUOTE_DOUBLE',
  QUOTE_SINGLE: 'QUOTE_SINGLE',
  SEQ: 'SEQ',
  SEQ_ITEM: 'SEQ_ITEM'
};
exports.Type = Type;

/***/ }),

/***/ 77:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _map = _interopRequireDefault(__webpack_require__(732));

var _seq = _interopRequireDefault(__webpack_require__(767));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _string = __webpack_require__(591);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schema = [_map.default, _seq.default, {
  identify: value => typeof value === 'string',
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: _string.resolveString,
  stringify: value => JSON.stringify(value)
}, {
  identify: value => value == null,
  createNode: (schema, value, ctx) => ctx.wrapScalars ? new _Scalar.default(null) : null,
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^null$/,
  resolve: () => null,
  stringify: value => JSON.stringify(value)
}, {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^true$/,
  resolve: () => true,
  stringify: value => JSON.stringify(value)
}, {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^false$/,
  resolve: () => false,
  stringify: value => JSON.stringify(value)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^-?(?:0|[1-9][0-9]*)$/,
  resolve: str => parseInt(str, 10),
  stringify: value => JSON.stringify(value)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
  resolve: str => parseFloat(str),
  stringify: value => JSON.stringify(value)
}];

schema.scalarFallback = str => {
  throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`);
};

var _default = schema;
exports.default = _default;

/***/ }),

/***/ 87:
/***/ (function(module) {

module.exports = require("os");

/***/ }),

/***/ 119:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PlainValue extends _Node.default {
  static endOfLine(src, start, inFlow) {
    let ch = src[start];
    let offset = start;

    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break;
      const next = src[offset + 1];
      if (ch === ':' && (!next || next === '\n' || next === '\t' || next === ' ' || inFlow && next === ',')) break;
      if ((ch === ' ' || ch === '\t') && next === '#') break;
      offset += 1;
      ch = next;
    }

    return offset;
  }

  get strValue() {
    if (!this.valueRange || !this.context) return null;
    let {
      start,
      end
    } = this.valueRange;
    const {
      src
    } = this.context;
    let ch = src[end - 1];

    while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) ch = src[--end - 1];

    ch = src[start];

    while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) ch = src[++start];

    let str = '';

    for (let i = start; i < end; ++i) {
      const ch = src[i];

      if (ch === '\n') {
        const {
          fold,
          offset
        } = _Node.default.foldNewline(src, i, -1);

        str += fold;
        i = offset;
      } else if (ch === ' ' || ch === '\t') {
        // trim trailing whitespace
        const wsStart = i;
        let next = src[i + 1];

        while (i < end && (next === ' ' || next === '\t')) {
          i += 1;
          next = src[i + 1];
        }

        if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch;
      } else {
        str += ch;
      }
    }

    return str;
  }

  parseBlockValue(start) {
    const {
      indent,
      inFlow,
      src
    } = this.context;
    let offset = start;
    let valueEnd = start;

    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      if (_Node.default.atDocumentBoundary(src, offset + 1)) break;

      const end = _Node.default.endOfBlockIndent(src, indent, offset + 1);

      if (end === null || src[end] === '#') break;

      if (src[end] === '\n') {
        offset = end;
      } else {
        valueEnd = PlainValue.endOfLine(src, end, inFlow);
        offset = valueEnd;
      }
    }

    if (this.valueRange.isEmpty()) this.valueRange.start = start;
    this.valueRange.end = valueEnd;
    return valueEnd;
  }
  /**
   * Parses a plain value from the source
   *
   * Accepted forms are:
   * ```
   * #comment
   *
   * first line
   *
   * first line #comment
   *
   * first line
   * block
   * lines
   *
   * #comment
   * block
   * lines
   * ```
   * where block lines are empty or have an indent level greater than `indent`.
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar, may be `\n`
   */


  parse(context, start) {
    this.context = context;
    const {
      inFlow,
      src
    } = context;
    let offset = start;
    const ch = src[offset];

    if (ch && ch !== '#' && ch !== '\n') {
      offset = PlainValue.endOfLine(src, start, inFlow);
    }

    this.valueRange = new _Range.default(start, offset);
    offset = _Node.default.endOfWhiteSpace(src, offset);
    offset = this.parseComment(offset);

    if (!this.hasComment || this.valueRange.isEmpty()) {
      offset = this.parseBlockValue(offset);
    }

    return offset;
  }

}

exports.default = PlainValue;

/***/ }),

/***/ 129:
/***/ (function(module) {

module.exports = require("child_process");

/***/ }),

/***/ 156:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Node {}

exports.default = Node;

/***/ }),

/***/ 185:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _BlankLine = _interopRequireDefault(__webpack_require__(794));

var _Comment = _interopRequireDefault(__webpack_require__(487));

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class FlowCollection extends _Node.default {
  constructor(type, props) {
    super(type, props);
    this.items = null;
  }

  prevNodeIsJsonLike(idx = this.items.length) {
    const node = this.items[idx - 1];
    return !!node && (node.jsonLike || node.type === _constants.Type.COMMENT && this.nodeIsJsonLike(idx - 1));
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  parse(context, start) {
    this.context = context;
    const {
      parseNode,
      src
    } = context;
    let {
      indent,
      lineStart
    } = context;
    let char = src[start]; // { or [

    this.items = [{
      char,
      offset: start
    }];

    let offset = _Node.default.endOfWhiteSpace(src, start + 1);

    char = src[offset];

    while (char && char !== ']' && char !== '}') {
      switch (char) {
        case '\n':
          {
            lineStart = offset + 1;

            const wsEnd = _Node.default.endOfWhiteSpace(src, lineStart);

            if (src[wsEnd] === '\n') {
              const blankLine = new _BlankLine.default();
              lineStart = blankLine.parse({
                src
              }, lineStart);
              this.items.push(blankLine);
            }

            offset = _Node.default.endOfIndent(src, lineStart);

            if (offset <= lineStart + indent) {
              char = src[offset];

              if (offset < lineStart + indent || char !== ']' && char !== '}') {
                const msg = 'Insufficient indentation in flow collection';
                this.error = new _errors.YAMLSemanticError(this, msg);
              }
            }
          }
          break;

        case ',':
          {
            this.items.push({
              char,
              offset
            });
            offset += 1;
          }
          break;

        case '#':
          {
            const comment = new _Comment.default();
            offset = comment.parse({
              src
            }, offset);
            this.items.push(comment);
          }
          break;

        case '?':
        case ':':
          {
            const next = src[offset + 1];

            if (next === '\n' || next === '\t' || next === ' ' || next === ',' || // in-flow : after JSON-like key does not need to be followed by whitespace
            char === ':' && this.prevNodeIsJsonLike()) {
              this.items.push({
                char,
                offset
              });
              offset += 1;
              break;
            }
          }
        // fallthrough

        default:
          {
            const node = parseNode({
              atLineStart: false,
              inCollection: false,
              inFlow: true,
              indent: -1,
              lineStart,
              parent: this
            }, offset);

            if (!node) {
              // at next document start
              this.valueRange = new _Range.default(start, offset);
              return offset;
            }

            this.items.push(node);
            offset = _Node.default.normalizeOffset(src, node.range.end);
          }
      }

      offset = _Node.default.endOfWhiteSpace(src, offset);
      char = src[offset];
    }

    this.valueRange = new _Range.default(start, offset + 1);

    if (char) {
      this.items.push({
        char,
        offset
      });
      offset = _Node.default.endOfWhiteSpace(src, offset + 1);
      offset = this.parseComment(offset);
    }

    return offset;
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset);
    this.items.forEach(node => {
      if (node instanceof _Node.default) {
        offset = node.setOrigRanges(cr, offset);
      } else if (cr.length === 0) {
        node.origOffset = node.offset;
      } else {
        let i = offset;

        while (i < cr.length) {
          if (cr[i] > node.offset) break;else ++i;
        }

        node.origOffset = node.offset + i;
        offset = i;
      }
    });
    return offset;
  }

  toString() {
    const {
      context: {
        src
      },
      items,
      range,
      value
    } = this;
    if (value != null) return value;
    const nodes = items.filter(item => item instanceof _Node.default);
    let str = '';
    let prevEnd = range.start;
    nodes.forEach(node => {
      const prefix = src.slice(prevEnd, node.range.start);
      prevEnd = node.range.end;
      str += prefix + String(node);

      if (str[str.length - 1] === '\n' && src[prevEnd - 1] !== '\n' && src[prevEnd] === '\n') {
        // Comment range does not include the terminal newline, but its
        // stringified value does. Without this fix, newlines at comment ends
        // get duplicated.
        prevEnd += 1;
      }
    });
    str += src.slice(prevEnd, range.end);
    return _Node.default.addStringTerminator(src, range.end, str);
  }

}

exports.default = FlowCollection;

/***/ }),

/***/ 195:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _map = _interopRequireDefault(__webpack_require__(732));

var _seq = _interopRequireDefault(__webpack_require__(767));

var _string = _interopRequireDefault(__webpack_require__(591));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = [_map.default, _seq.default, _string.default];
exports.default = _default;

/***/ }),

/***/ 255:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _warnings = __webpack_require__(847);

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _stringify = __webpack_require__(454);

var _tags = __webpack_require__(339);

var _string = __webpack_require__(591);

var _Alias = _interopRequireDefault(__webpack_require__(637));

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Node = _interopRequireDefault(__webpack_require__(156));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const isMap = ({
  type
}) => type === _constants.Type.FLOW_MAP || type === _constants.Type.MAP;

const isSeq = ({
  type
}) => type === _constants.Type.FLOW_SEQ || type === _constants.Type.SEQ;

class Schema {
  constructor({
    customTags,
    merge,
    schema,
    tags: deprecatedCustomTags
  }) {
    this.merge = !!merge;
    this.name = schema;
    this.tags = _tags.schemas[schema.replace(/\W/g, '')]; // 'yaml-1.1' -> 'yaml11'

    if (!this.tags) {
      const keys = Object.keys(_tags.schemas).map(key => JSON.stringify(key)).join(', ');
      throw new Error(`Unknown schema "${schema}"; use one of ${keys}`);
    }

    if (!customTags && deprecatedCustomTags) {
      customTags = deprecatedCustomTags;
      (0, _warnings.warnOptionDeprecation)('tags', 'customTags');
    }

    if (Array.isArray(customTags)) {
      for (const tag of customTags) this.tags = this.tags.concat(tag);
    } else if (typeof customTags === 'function') {
      this.tags = customTags(this.tags.slice());
    }

    for (let i = 0; i < this.tags.length; ++i) {
      const tag = this.tags[i];

      if (typeof tag === 'string') {
        const tagObj = _tags.tags[tag];

        if (!tagObj) {
          const keys = Object.keys(_tags.tags).map(key => JSON.stringify(key)).join(', ');
          throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`);
        }

        this.tags[i] = tagObj;
      }
    }
  }

  createNode(value, wrapScalars, tag, ctx) {
    if (value instanceof _Node.default) return value;
    let tagObj;

    if (tag) {
      if (tag.startsWith('!!')) tag = Schema.defaultPrefix + tag.slice(2);
      const match = this.tags.filter(t => t.tag === tag);
      tagObj = match.find(t => !t.format) || match[0];
      if (!tagObj) throw new Error(`Tag ${tag} not found`);
    } else {
      // TODO: deprecate/remove class check
      tagObj = this.tags.find(t => (t.identify && t.identify(value) || t.class && value instanceof t.class) && !t.format);

      if (!tagObj) {
        if (typeof value.toJSON === 'function') value = value.toJSON();
        if (typeof value !== 'object') return wrapScalars ? new _Scalar.default(value) : value;
        tagObj = value instanceof Map ? _tags.tags.map : value[Symbol.iterator] ? _tags.tags.seq : _tags.tags.map;
      }
    }

    if (!ctx) ctx = {
      wrapScalars
    };else ctx.wrapScalars = wrapScalars;

    if (ctx.onTagObj) {
      ctx.onTagObj(tagObj);
      delete ctx.onTagObj;
    }

    const obj = {};

    if (value && typeof value === 'object' && ctx.prevObjects) {
      const prev = ctx.prevObjects.find(o => o.value === value);

      if (prev) {
        const alias = new _Alias.default(prev); // leaves source dirty; must be cleaned by caller

        ctx.aliasNodes.push(alias);
        return alias;
      }

      obj.value = value;
      ctx.prevObjects.push(obj);
    }

    obj.node = tagObj.createNode ? tagObj.createNode(this, value, ctx) : wrapScalars ? new _Scalar.default(value) : value;
    return obj.node;
  }

  createPair(key, value, ctx) {
    const k = this.createNode(key, ctx.wrapScalars, null, ctx);
    const v = this.createNode(value, ctx.wrapScalars, null, ctx);
    return new _Pair.default(k, v);
  } // falls back to string on no match


  resolveScalar(str, tags) {
    if (!tags) tags = this.tags;

    for (let i = 0; i < tags.length; ++i) {
      const {
        format,
        test,
        resolve
      } = tags[i];

      if (test) {
        const match = str.match(test);

        if (match) {
          let res = resolve.apply(null, match);
          if (!(res instanceof _Scalar.default)) res = new _Scalar.default(res);
          if (format) res.format = format;
          return res;
        }
      }
    }

    if (this.tags.scalarFallback) str = this.tags.scalarFallback(str);
    return new _Scalar.default(str);
  } // sets node.resolved on success


  resolveNode(doc, node, tagName) {
    const tags = this.tags.filter(({
      tag
    }) => tag === tagName);
    const generic = tags.find(({
      test
    }) => !test);
    if (node.error) doc.errors.push(node.error);

    try {
      if (generic) {
        let res = generic.resolve(doc, node);
        if (!(res instanceof _Collection.default)) res = new _Scalar.default(res);
        node.resolved = res;
      } else {
        const str = (0, _string.resolveString)(doc, node);

        if (typeof str === 'string' && tags.length > 0) {
          node.resolved = this.resolveScalar(str, tags);
        }
      }
    } catch (error) {
      if (!error.source) error.source = node;
      doc.errors.push(error);
      node.resolved = null;
    }

    if (!node.resolved) return null;
    if (tagName && node.tag) node.resolved.tag = tagName;
    return node.resolved;
  }

  resolveNodeWithFallback(doc, node, tagName) {
    const res = this.resolveNode(doc, node, tagName);
    if (Object.prototype.hasOwnProperty.call(node, 'resolved')) return res;
    const fallback = isMap(node) ? Schema.defaultTags.MAP : isSeq(node) ? Schema.defaultTags.SEQ : Schema.defaultTags.STR;

    if (fallback) {
      doc.warnings.push(new _errors.YAMLWarning(node, `The tag ${tagName} is unavailable, falling back to ${fallback}`));
      const res = this.resolveNode(doc, node, fallback);
      res.tag = tagName;
      return res;
    } else {
      doc.errors.push(new _errors.YAMLReferenceError(node, `The tag ${tagName} is unavailable`));
    }

    return null;
  }

  getTagObject(item) {
    if (item instanceof _Alias.default) return _Alias.default;

    if (item.tag) {
      const match = this.tags.filter(t => t.tag === item.tag);
      if (match.length > 0) return match.find(t => t.format === item.format) || match[0];
    }

    let tagObj, obj;

    if (item instanceof _Scalar.default) {
      obj = item.value; // TODO: deprecate/remove class check

      const match = this.tags.filter(t => t.identify && t.identify(obj) || t.class && obj instanceof t.class);
      tagObj = match.find(t => t.format === item.format) || match.find(t => !t.format);
    } else {
      obj = item;
      tagObj = this.tags.find(t => t.nodeClass && obj instanceof t.nodeClass);
    }

    if (!tagObj) {
      const name = obj && obj.constructor ? obj.constructor.name : typeof obj;
      throw new Error(`Tag not resolved for ${name} value`);
    }

    return tagObj;
  } // needs to be called before stringifier to allow for circular anchor refs


  stringifyProps(node, tagObj, {
    anchors,
    doc
  }) {
    const props = [];
    const anchor = doc.anchors.getName(node);

    if (anchor) {
      anchors[anchor] = node;
      props.push(`&${anchor}`);
    }

    if (node.tag) {
      props.push(doc.stringifyTag(node.tag));
    } else if (!tagObj.default) {
      props.push(doc.stringifyTag(tagObj.tag));
    }

    return props.join(' ');
  }

  stringify(item, ctx, onComment, onChompKeep) {
    let tagObj;

    if (!(item instanceof _Node.default)) {
      const createCtx = {
        aliasNodes: [],
        onTagObj: o => tagObj = o,
        prevObjects: []
      };
      item = this.createNode(item, true, null, createCtx);
      const {
        anchors
      } = ctx.doc;

      for (const alias of createCtx.aliasNodes) {
        alias.source = alias.source.node;
        let name = anchors.getName(alias.source);

        if (!name) {
          name = anchors.newName();
          anchors.map[name] = alias.source;
        }
      }
    }

    ctx.tags = this;
    if (item instanceof _Pair.default) return item.toString(ctx, onComment, onChompKeep);
    if (!tagObj) tagObj = this.getTagObject(item);
    const props = this.stringifyProps(item, tagObj, ctx);
    const str = typeof tagObj.stringify === 'function' ? tagObj.stringify(item, ctx, onComment, onChompKeep) : item instanceof _Collection.default ? item.toString(ctx, onComment, onChompKeep) : (0, _stringify.stringifyString)(item, ctx, onComment, onChompKeep);
    return props ? item instanceof _Collection.default && str[0] !== '{' && str[0] !== '[' ? `${props}\n${ctx.indent}${str}` : `${props} ${str}` : str;
  }

}

exports.default = Schema;

_defineProperty(Schema, "defaultPrefix", 'tag:yaml.org,2002:');

_defineProperty(Schema, "defaultTags", {
  MAP: 'tag:yaml.org,2002:map',
  SEQ: 'tag:yaml.org,2002:seq',
  STR: 'tag:yaml.org,2002:str'
});

/***/ }),

/***/ 309:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

var _Document = _interopRequireDefault(__webpack_require__(928));

var _ParseContext = _interopRequireDefault(__webpack_require__(968));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Published as 'yaml/parse-cst'
function parse(src) {
  const cr = [];

  if (src.indexOf('\r') !== -1) {
    src = src.replace(/\r\n?/g, (match, offset) => {
      if (match.length > 1) cr.push(offset);
      return '\n';
    });
  }

  const documents = [];
  let offset = 0;

  do {
    const doc = new _Document.default();
    const context = new _ParseContext.default({
      src
    });
    offset = doc.parse(context, offset);
    documents.push(doc);
  } while (offset < src.length);

  documents.setOrigRanges = () => {
    if (cr.length === 0) return false;

    for (let i = 1; i < cr.length; ++i) cr[i] -= i;

    let crOffset = 0;

    for (let i = 0; i < documents.length; ++i) {
      crOffset = documents[i].setOrigRanges(cr, crOffset);
    }

    cr.splice(0, cr.length);
    return true;
  };

  documents.toString = () => documents.join('...\n');

  return documents;
}

/***/ }),

/***/ 325:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _addComment = _interopRequireDefault(__webpack_require__(836));

var _constants = __webpack_require__(49);

var _toJSON = _interopRequireDefault(__webpack_require__(923));

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Node = _interopRequireDefault(__webpack_require__(156));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Published as 'yaml/pair'
const stringifyKey = (key, jsKey, ctx) => {
  if (jsKey === null) return '';
  if (typeof jsKey !== 'object') return String(jsKey);
  if (key instanceof _Node.default && ctx && ctx.doc) return key.toString({
    anchors: {},
    doc: ctx.doc,
    indent: '',
    inFlow: true,
    inStringifyKey: true
  });
  return JSON.stringify(jsKey);
};

class Pair extends _Node.default {
  constructor(key, value = null) {
    super();
    this.key = key;
    this.value = value;
    this.type = 'PAIR';
  }

  get commentBefore() {
    return this.key && this.key.commentBefore;
  }

  set commentBefore(cb) {
    if (this.key == null) this.key = new _Scalar.default(null);
    this.key.commentBefore = cb;
  }

  addToJSMap(ctx, map) {
    const key = (0, _toJSON.default)(this.key, '', ctx);

    if (map instanceof Map) {
      const value = (0, _toJSON.default)(this.value, key, ctx);
      map.set(key, value);
    } else if (map instanceof Set) {
      map.add(key);
    } else {
      const stringKey = stringifyKey(this.key, key, ctx);
      map[stringKey] = (0, _toJSON.default)(this.value, stringKey, ctx);
    }

    return map;
  }

  toJSON(_, ctx) {
    const pair = ctx && ctx.mapAsMap ? new Map() : {};
    return this.addToJSMap(ctx, pair);
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx || !ctx.doc) return JSON.stringify(this);
    const {
      simpleKeys
    } = ctx.doc.options;
    let {
      key,
      value
    } = this;
    let keyComment = key instanceof _Node.default && key.comment;

    if (simpleKeys) {
      if (keyComment) {
        throw new Error('With simple keys, key nodes cannot have comments');
      }

      if (key instanceof _Collection.default) {
        const msg = 'With simple keys, collection cannot be used as a key value';
        throw new Error(msg);
      }
    }

    const explicitKey = !simpleKeys && (!key || keyComment || key instanceof _Collection.default || key.type === _constants.Type.BLOCK_FOLDED || key.type === _constants.Type.BLOCK_LITERAL);
    const {
      doc,
      indent
    } = ctx;
    ctx = Object.assign({}, ctx, {
      implicitKey: !explicitKey,
      indent: indent + '  '
    });
    let chompKeep = false;
    let str = doc.schema.stringify(key, ctx, () => keyComment = null, () => chompKeep = true);
    str = (0, _addComment.default)(str, ctx.indent, keyComment);

    if (ctx.allNullValues && !simpleKeys) {
      if (this.comment) {
        str = (0, _addComment.default)(str, ctx.indent, this.comment);
        if (onComment) onComment();
      } else if (chompKeep && !keyComment && onChompKeep) onChompKeep();

      return ctx.inFlow ? str : `? ${str}`;
    }

    str = explicitKey ? `? ${str}\n${indent}:` : `${str}:`;

    if (this.comment) {
      // expected (but not strictly required) to be a single-line comment
      str = (0, _addComment.default)(str, ctx.indent, this.comment);
      if (onComment) onComment();
    }

    let vcb = '';
    let valueComment = null;

    if (value instanceof _Node.default) {
      if (value.spaceBefore) vcb = '\n';

      if (value.commentBefore) {
        const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`);
        vcb += `\n${cs}`;
      }

      valueComment = value.comment;
    } else if (value && typeof value === 'object') {
      value = doc.schema.createNode(value, true);
    }

    ctx.implicitKey = false;
    chompKeep = false;
    const valueStr = doc.schema.stringify(value, ctx, () => valueComment = null, () => chompKeep = true);
    let ws = ' ';

    if (vcb || this.comment) {
      ws = `${vcb}\n${ctx.indent}`;
    } else if (!explicitKey && value instanceof _Collection.default) {
      const flow = valueStr[0] === '[' || valueStr[0] === '{';
      if (!flow || valueStr.includes('\n')) ws = `\n${ctx.indent}`;
    }

    if (chompKeep && !valueComment && onChompKeep) onChompKeep();
    return (0, _addComment.default)(str + ws + valueStr, ctx.indent, valueComment);
  }

}

exports.default = Pair;

/***/ }),

/***/ 339:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tags = exports.schemas = void 0;

var _core = _interopRequireDefault(__webpack_require__(775));

var _failsafe = _interopRequireDefault(__webpack_require__(195));

var _json = _interopRequireDefault(__webpack_require__(77));

var _yaml = _interopRequireDefault(__webpack_require__(550));

var _map = _interopRequireDefault(__webpack_require__(732));

var _seq = _interopRequireDefault(__webpack_require__(767));

var _binary = _interopRequireDefault(__webpack_require__(996));

var _omap = _interopRequireDefault(__webpack_require__(821));

var _pairs = _interopRequireDefault(__webpack_require__(566));

var _set = _interopRequireDefault(__webpack_require__(785));

var _timestamp = __webpack_require__(414);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const schemas = {
  core: _core.default,
  failsafe: _failsafe.default,
  json: _json.default,
  yaml11: _yaml.default
};
exports.schemas = schemas;
const tags = {
  binary: _binary.default,
  floatTime: _timestamp.floatTime,
  intTime: _timestamp.intTime,
  map: _map.default,
  omap: _omap.default,
  pairs: _pairs.default,
  seq: _seq.default,
  set: _set.default,
  timestamp: _timestamp.timestamp
};
exports.tags = tags;

/***/ }),

/***/ 380:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.isEmptyPath = void 0;

var _addComment = _interopRequireDefault(__webpack_require__(836));

var _Node = _interopRequireDefault(__webpack_require__(156));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// null, undefined, or an empty non-string iterable (e.g. [])
const isEmptyPath = path => path == null || typeof path === 'object' && path[Symbol.iterator]().next().done;

exports.isEmptyPath = isEmptyPath;

class Collection extends _Node.default {
  constructor(...args) {
    super(...args);

    _defineProperty(this, "items", []);
  }

  addIn(path, value) {
    if (isEmptyPath(path)) this.add(value);else {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (node instanceof Collection) node.addIn(rest, value);else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }

  deleteIn([key, ...rest]) {
    if (rest.length === 0) return this.delete(key);
    const node = this.get(key, true);
    if (node instanceof Collection) return node.deleteIn(rest);else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  }

  getIn([key, ...rest], keepScalar) {
    const node = this.get(key, true);
    if (rest.length === 0) return !keepScalar && node instanceof _Scalar.default ? node.value : node;else return node instanceof Collection ? node.getIn(rest, keepScalar) : undefined;
  }

  hasAllNullValues() {
    return this.items.every(node => {
      if (!(node instanceof _Pair.default)) return false;
      const n = node.value;
      return n == null || n instanceof _Scalar.default && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }

  hasIn([key, ...rest]) {
    if (rest.length === 0) return this.has(key);
    const node = this.get(key, true);
    return node instanceof Collection ? node.hasIn(rest) : false;
  }

  setIn([key, ...rest], value) {
    if (rest.length === 0) {
      this.set(key, value);
    } else {
      const node = this.get(key, true);
      if (node instanceof Collection) node.setIn(rest, value);else throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  } // overridden in implementations


  toJSON() {
    return null;
  }

  toString(ctx, {
    blockItem,
    flowChars,
    isMap,
    itemIndent
  }, onComment, onChompKeep) {
    const {
      doc,
      indent
    } = ctx;
    const inFlow = this.type && this.type.substr(0, 4) === 'FLOW' || ctx.inFlow;
    if (inFlow) itemIndent += '  ';
    const allNullValues = isMap && this.hasAllNullValues();
    ctx = Object.assign({}, ctx, {
      allNullValues,
      indent: itemIndent,
      inFlow,
      type: null
    });
    let chompKeep = false;
    let hasItemWithNewLine = false;
    const nodes = this.items.reduce((nodes, item, i) => {
      let comment;

      if (item) {
        if (!chompKeep && item.spaceBefore) nodes.push({
          type: 'comment',
          str: ''
        });
        if (item.commentBefore) item.commentBefore.match(/^.*$/gm).forEach(line => {
          nodes.push({
            type: 'comment',
            str: `#${line}`
          });
        });
        if (item.comment) comment = item.comment;
        if (inFlow && (!chompKeep && item.spaceBefore || item.commentBefore || item.comment || item.key && (item.key.commentBefore || item.key.comment) || item.value && (item.value.commentBefore || item.value.comment))) hasItemWithNewLine = true;
      }

      chompKeep = false;
      let str = doc.schema.stringify(item, ctx, () => comment = null, () => chompKeep = true);
      if (inFlow && !hasItemWithNewLine && str.includes('\n')) hasItemWithNewLine = true;
      if (inFlow && i < this.items.length - 1) str += ',';
      str = (0, _addComment.default)(str, itemIndent, comment);
      if (chompKeep && (comment || inFlow)) chompKeep = false;
      nodes.push({
        type: 'item',
        str
      });
      return nodes;
    }, []);
    let str;

    if (nodes.length === 0) {
      str = flowChars.start + flowChars.end;
    } else if (inFlow) {
      const {
        start,
        end
      } = flowChars;
      const strings = nodes.map(n => n.str);

      if (hasItemWithNewLine || strings.reduce((sum, str) => sum + str.length + 2, 2) > Collection.maxFlowStringSingleLineLength) {
        str = start;

        for (const s of strings) {
          str += s ? `\n  ${indent}${s}` : '\n';
        }

        str += `\n${indent}${end}`;
      } else {
        str = `${start} ${strings.join(' ')} ${end}`;
      }
    } else {
      const strings = nodes.map(blockItem);
      str = strings.shift();

      for (const s of strings) str += s ? `\n${indent}${s}` : '\n';
    }

    if (this.comment) {
      str += '\n' + this.comment.replace(/^/gm, `${indent}#`);
      if (onComment) onComment();
    } else if (chompKeep && onChompKeep) onChompKeep();

    return str;
  }

}

exports.default = Collection;

_defineProperty(Collection, "maxFlowStringSingleLineLength", 60);

/***/ }),

/***/ 386:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.MERGE_KEY = void 0;

var _Map = _interopRequireDefault(__webpack_require__(684));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _Seq = _interopRequireDefault(__webpack_require__(29));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MERGE_KEY = '<<';
exports.MERGE_KEY = MERGE_KEY;

class Merge extends _Pair.default {
  constructor(pair) {
    if (pair instanceof _Pair.default) {
      let seq = pair.value;

      if (!(seq instanceof _Seq.default)) {
        seq = new _Seq.default();
        seq.items.push(pair.value);
        seq.range = pair.value.range;
      }

      super(pair.key, seq);
      this.range = pair.range;
    } else {
      super(new _Scalar.default(MERGE_KEY), new _Seq.default());
    }

    this.type = 'MERGE_PAIR';
  } // If the value associated with a merge key is a single mapping node, each of
  // its key/value pairs is inserted into the current mapping, unless the key
  // already exists in it. If the value associated with the merge key is a
  // sequence, then this sequence is expected to contain mapping nodes and each
  // of these nodes is merged in turn according to its order in the sequence.
  // Keys in mapping nodes earlier in the sequence override keys specified in
  // later mapping nodes. -- http://yaml.org/type/merge.html


  addToJSMap(ctx, map) {
    for (const {
      source
    } of this.value.items) {
      if (!(source instanceof _Map.default)) throw new Error('Merge sources must be maps');
      const srcMap = source.toJSON(null, ctx, Map);

      for (const [key, value] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key)) map.set(key, value);
        } else if (map instanceof Set) {
          map.add(key);
        } else {
          if (!Object.prototype.hasOwnProperty.call(map, key)) map[key] = value;
        }
      }
    }

    return map;
  }

  toString(ctx, onComment) {
    const seq = this.value;
    if (seq.items.length > 1) return super.toString(ctx, onComment);
    this.value = seq.items[0];
    const str = super.toString(ctx, onComment);
    this.value = seq;
    return str;
  }

}

exports.default = Merge;

/***/ }),

/***/ 405:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.YAMLWarning = exports.YAMLSyntaxError = exports.YAMLSemanticError = exports.YAMLReferenceError = exports.YAMLError = void 0;

var _Node = _interopRequireDefault(__webpack_require__(974));

var _sourceUtils = __webpack_require__(41);

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class YAMLError extends Error {
  constructor(name, source, message) {
    if (!message || !(source instanceof _Node.default)) throw new Error(`Invalid arguments for new ${name}`);
    super();
    this.name = name;
    this.message = message;
    this.source = source;
  }

  makePretty() {
    if (!this.source) return;
    this.nodeType = this.source.type;
    const cst = this.source.context && this.source.context.root;

    if (typeof this.offset === 'number') {
      this.range = new _Range.default(this.offset, this.offset + 1);
      const start = cst && (0, _sourceUtils.getLinePos)(this.offset, cst);

      if (start) {
        const end = {
          line: start.line,
          col: start.col + 1
        };
        this.linePos = {
          start,
          end
        };
      }

      delete this.offset;
    } else {
      this.range = this.source.range;
      this.linePos = this.source.rangeAsLinePos;
    }

    if (this.linePos) {
      const {
        line,
        col
      } = this.linePos.start;
      this.message += ` at line ${line}, column ${col}`;
      const ctx = cst && (0, _sourceUtils.getPrettyContext)(this.linePos, cst);
      if (ctx) this.message += `:\n\n${ctx}\n`;
    }

    delete this.source;
  }

}

exports.YAMLError = YAMLError;

class YAMLReferenceError extends YAMLError {
  constructor(source, message) {
    super('YAMLReferenceError', source, message);
  }

}

exports.YAMLReferenceError = YAMLReferenceError;

class YAMLSemanticError extends YAMLError {
  constructor(source, message) {
    super('YAMLSemanticError', source, message);
  }

}

exports.YAMLSemanticError = YAMLSemanticError;

class YAMLSyntaxError extends YAMLError {
  constructor(source, message) {
    super('YAMLSyntaxError', source, message);
  }

}

exports.YAMLSyntaxError = YAMLSyntaxError;

class YAMLWarning extends YAMLError {
  constructor(source, message) {
    super('YAMLWarning', source, message);
  }

}

exports.YAMLWarning = YAMLWarning;

/***/ }),

/***/ 411:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _errors = __webpack_require__(405);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class QuoteSingle extends _Node.default {
  static endOfQuote(src, offset) {
    let ch = src[offset];

    while (ch) {
      if (ch === "'") {
        if (src[offset + 1] !== "'") break;
        ch = src[offset += 2];
      } else {
        ch = src[offset += 1];
      }
    }

    return offset + 1;
  }
  /**
   * @returns {string | { str: string, errors: YAMLSyntaxError[] }}
   */


  get strValue() {
    if (!this.valueRange || !this.context) return null;
    const errors = [];
    const {
      start,
      end
    } = this.valueRange;
    const {
      indent,
      src
    } = this.context;
    if (src[end - 1] !== "'") errors.push(new _errors.YAMLSyntaxError(this, "Missing closing 'quote"));
    let str = '';

    for (let i = start + 1; i < end - 1; ++i) {
      const ch = src[i];

      if (ch === '\n') {
        if (_Node.default.atDocumentBoundary(src, i + 1)) errors.push(new _errors.YAMLSemanticError(this, 'Document boundary indicators are not allowed within string values'));

        const {
          fold,
          offset,
          error
        } = _Node.default.foldNewline(src, i, indent);

        str += fold;
        i = offset;
        if (error) errors.push(new _errors.YAMLSemanticError(this, 'Multi-line single-quoted string needs to be sufficiently indented'));
      } else if (ch === "'") {
        str += ch;
        i += 1;
        if (src[i] !== "'") errors.push(new _errors.YAMLSyntaxError(this, 'Unescaped single quote? This should not happen.'));
      } else if (ch === ' ' || ch === '\t') {
        // trim trailing whitespace
        const wsStart = i;
        let next = src[i + 1];

        while (next === ' ' || next === '\t') {
          i += 1;
          next = src[i + 1];
        }

        if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch;
      } else {
        str += ch;
      }
    }

    return errors.length > 0 ? {
      errors,
      str
    } : str;
  }
  /**
   * Parses a 'single quoted' value from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */


  parse(context, start) {
    this.context = context;
    const {
      src
    } = context;
    let offset = QuoteSingle.endOfQuote(src, start + 1);
    this.valueRange = new _Range.default(start, offset);
    offset = _Node.default.endOfWhiteSpace(src, offset);
    offset = this.parseComment(offset);
    return offset;
  }

}

exports.default = QuoteSingle;

/***/ }),

/***/ 414:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timestamp = exports.floatTime = exports.intTime = void 0;

var _stringify = __webpack_require__(454);

const parseSexagesimal = (sign, parts) => {
  const n = parts.split(':').reduce((n, p) => n * 60 + Number(p), 0);
  return sign === '-' ? -n : n;
}; // hhhh:mm:ss.sss


const stringifySexagesimal = ({
  value
}) => {
  if (isNaN(value) || !isFinite(value)) return (0, _stringify.stringifyNumber)(value);
  let sign = '';

  if (value < 0) {
    sign = '-';
    value = Math.abs(value);
  }

  const parts = [value % 60]; // seconds, including ms

  if (value < 60) {
    parts.unshift(0); // at least one : is required
  } else {
    value = Math.round((value - parts[0]) / 60);
    parts.unshift(value % 60); // minutes

    if (value >= 60) {
      value = Math.round((value - parts[0]) / 60);
      parts.unshift(value); // hours
    }
  }

  return sign + parts.map(n => n < 10 ? '0' + String(n) : String(n)).join(':').replace(/000000\d*$/, '') // % 60 may introduce error
  ;
};

const intTime = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'TIME',
  test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,
  resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, '')),
  stringify: stringifySexagesimal
};
exports.intTime = intTime;
const floatTime = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'TIME',
  test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,
  resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, '')),
  stringify: stringifySexagesimal
};
exports.floatTime = floatTime;
const timestamp = {
  identify: value => value instanceof Date,
  default: true,
  tag: 'tag:yaml.org,2002:timestamp',
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp('^(?:' + '([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
  '(?:(?:t|T|[ \\t]+)' + // t | T | whitespace
  '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
  '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
  ')?' + ')$'),
  resolve: (str, year, month, day, hour, minute, second, millisec, tz) => {
    if (millisec) millisec = (millisec + '00').substr(1, 3);
    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec || 0);

    if (tz && tz !== 'Z') {
      let d = parseSexagesimal(tz[0], tz.slice(1));
      if (Math.abs(d) < 30) d *= 60;
      date -= 60000 * d;
    }

    return new Date(date);
  },
  stringify: ({
    value
  }) => value.toISOString().replace(/((T00:00)?:00)?\.000Z$/, '')
};
exports.timestamp = timestamp;

/***/ }),

/***/ 415:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = foldFlowLines;
exports.FOLD_QUOTED = exports.FOLD_BLOCK = exports.FOLD_FLOW = void 0;
const FOLD_FLOW = 'flow';
exports.FOLD_FLOW = FOLD_FLOW;
const FOLD_BLOCK = 'block';
exports.FOLD_BLOCK = FOLD_BLOCK;
const FOLD_QUOTED = 'quoted'; // presumes i+1 is at the start of a line
// returns index of last newline in more-indented block

exports.FOLD_QUOTED = FOLD_QUOTED;

const consumeMoreIndentedLines = (text, i) => {
  let ch = text[i + 1];

  while (ch === ' ' || ch === '\t') {
    do {
      ch = text[i += 1];
    } while (ch && ch !== '\n');

    ch = text[i + 1];
  }

  return i;
};
/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 *
 * @param {string} text
 * @param {string} indent
 * @param {string} [mode='flow'] `'block'` prevents more-indented lines
 *   from being folded; `'quoted'` allows for `\` escapes, including escaped
 *   newlines
 * @param {Object} options
 * @param {number} [options.indentAtStart] Accounts for leading contents on
 *   the first line, defaulting to `indent.length`
 * @param {number} [options.lineWidth=80]
 * @param {number} [options.minContentWidth=20] Allow highly indented lines to
 *   stretch the line width
 * @param {function} options.onFold Called once if the text is folded
 * @param {function} options.onFold Called once if any line of text exceeds
 *   lineWidth characters
 */


function foldFlowLines(text, indent, mode, {
  indentAtStart,
  lineWidth = 80,
  minContentWidth = 20,
  onFold,
  onOverflow
}) {
  if (!lineWidth || lineWidth < 0) return text;
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text.length <= endStep) return text;
  const folds = [];
  const escapedFolds = {};
  let end = lineWidth - (typeof indentAtStart === 'number' ? indentAtStart : indent.length);
  let split = undefined;
  let prev = undefined;
  let overflow = false;
  let i = -1;

  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text, i);
    if (i !== -1) end = i + endStep;
  }

  for (let ch; ch = text[i += 1];) {
    if (mode === FOLD_QUOTED && ch === '\\') {
      switch (text[i + 1]) {
        case 'x':
          i += 3;
          break;

        case 'u':
          i += 5;
          break;

        case 'U':
          i += 9;
          break;

        default:
          i += 1;
      }
    }

    if (ch === '\n') {
      if (mode === FOLD_BLOCK) i = consumeMoreIndentedLines(text, i);
      end = i + endStep;
      split = undefined;
    } else {
      if (ch === ' ' && prev && prev !== ' ' && prev !== '\n' && prev !== '\t') {
        // space surrounded by non-space can be replaced with newline + indent
        const next = text[i + 1];
        if (next && next !== ' ' && next !== '\n' && next !== '\t') split = i;
      }

      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = undefined;
        } else if (mode === FOLD_QUOTED) {
          // white-space collected at end may stretch past lineWidth
          while (prev === ' ' || prev === '\t') {
            prev = ch;
            ch = text[i += 1];
            overflow = true;
          } // i - 2 accounts for not-dropped last char + newline-escaping \


          folds.push(i - 2);
          escapedFolds[i - 2] = true;
          end = i - 2 + endStep;
          split = undefined;
        } else {
          overflow = true;
        }
      }
    }

    prev = ch;
  }

  if (overflow && onOverflow) onOverflow();
  if (folds.length === 0) return text;
  if (onFold) onFold();
  let res = text.slice(0, folds[0]);

  for (let i = 0; i < folds.length; ++i) {
    const fold = folds[i];
    const end = folds[i + 1] || text.length;
    if (mode === FOLD_QUOTED && escapedFolds[fold]) res += `${text[fold]}\\`;
    res += `\n${indent}${text.slice(fold + 1, end)}`;
  }

  return res;
}

/***/ }),

/***/ 422:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.strOptions = exports.nullOptions = exports.boolOptions = exports.binaryOptions = void 0;

var _constants = __webpack_require__(49);

const binaryOptions = {
  defaultType: _constants.Type.BLOCK_LITERAL,
  lineWidth: 76
};
exports.binaryOptions = binaryOptions;
const boolOptions = {
  trueStr: 'true',
  falseStr: 'false'
};
exports.boolOptions = boolOptions;
const nullOptions = {
  nullStr: 'null'
};
exports.nullOptions = nullOptions;
const strOptions = {
  defaultType: _constants.Type.PLAIN,
  doubleQuoted: {
    jsonEncoding: false,
    minMultiLineLength: 40
  },
  fold: {
    lineWidth: 80,
    minContentWidth: 20
  }
};
exports.strOptions = strOptions;

/***/ }),

/***/ 431:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const os = __webpack_require__(87);
/**
 * Commands
 *
 * Command Format:
 *   ##[name key=value;key=value]message
 *
 * Examples:
 *   ##[warning]This is the user warning message
 *   ##[set-secret name=mypassword]definitelyNotAPassword!
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        // safely append the val - avoid blowing up when attempting to
                        // call .replace() if message is not a string for some reason
                        cmdStr += `${key}=${escape(`${val || ''}`)},`;
                    }
                }
            }
        }
        cmdStr += CMD_STRING;
        // safely append the message - avoid blowing up when attempting to
        // call .replace() if message is not a string for some reason
        const message = `${this.message || ''}`;
        cmdStr += escapeData(message);
        return cmdStr;
    }
}
function escapeData(s) {
    return s.replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
function escape(s) {
    return s
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/]/g, '%5D')
        .replace(/;/g, '%3B');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 454:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringifyNumber = stringifyNumber;
exports.stringifyString = stringifyString;

var _addComment = __webpack_require__(836);

var _constants = __webpack_require__(49);

var _foldFlowLines = _interopRequireWildcard(__webpack_require__(415));

var _options = __webpack_require__(422);

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function stringifyNumber({
  format,
  minFractionDigits,
  tag,
  value
}) {
  if (!isFinite(value)) return isNaN(value) ? '.nan' : value < 0 ? '-.inf' : '.inf';
  let n = JSON.stringify(value);

  if (!format && minFractionDigits && (!tag || tag === 'tag:yaml.org,2002:float') && /^\d/.test(n)) {
    let i = n.indexOf('.');

    if (i < 0) {
      i = n.length;
      n += '.';
    }

    let d = minFractionDigits - (n.length - i - 1);

    while (d-- > 0) n += '0';
  }

  return n;
}

function lineLengthOverLimit(str, limit) {
  const strLen = str.length;
  if (strLen <= limit) return false;

  for (let i = 0, start = 0; i < strLen; ++i) {
    if (str[i] === '\n') {
      if (i - start > limit) return true;
      start = i + 1;
      if (strLen - start <= limit) return false;
    }
  }

  return true;
}

function doubleQuotedString(value, {
  implicitKey,
  indent
}) {
  const {
    jsonEncoding,
    minMultiLineLength
  } = _options.strOptions.doubleQuoted;
  const json = JSON.stringify(value);
  if (jsonEncoding) return json;
  let str = '';
  let start = 0;

  for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
    if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
      // space before newline needs to be escaped to not be folded
      str += json.slice(start, i) + '\\ ';
      i += 1;
      start = i;
      ch = '\\';
    }

    if (ch === '\\') switch (json[i + 1]) {
      case 'u':
        {
          str += json.slice(start, i);
          const code = json.substr(i + 2, 4);

          switch (code) {
            case '0000':
              str += '\\0';
              break;

            case '0007':
              str += '\\a';
              break;

            case '000b':
              str += '\\v';
              break;

            case '001b':
              str += '\\e';
              break;

            case '0085':
              str += '\\N';
              break;

            case '00a0':
              str += '\\_';
              break;

            case '2028':
              str += '\\L';
              break;

            case '2029':
              str += '\\P';
              break;

            default:
              if (code.substr(0, 2) === '00') str += '\\x' + code.substr(2);else str += json.substr(i, 6);
          }

          i += 5;
          start = i + 1;
        }
        break;

      case 'n':
        if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
          i += 1;
        } else {
          // folding will eat first newline
          str += json.slice(start, i) + '\n\n';

          while (json[i + 2] === '\\' && json[i + 3] === 'n' && json[i + 4] !== '"') {
            str += '\n';
            i += 2;
          }

          str += indent; // space after newline needs to be escaped to not be folded

          if (json[i + 2] === ' ') str += '\\';
          i += 1;
          start = i + 1;
        }

        break;

      default:
        i += 1;
    }
  }

  str = start ? str + json.slice(start) : json;
  return implicitKey ? str : (0, _foldFlowLines.default)(str, indent, _foldFlowLines.FOLD_QUOTED, _options.strOptions.fold);
}

function singleQuotedString(value, ctx) {
  const {
    indent,
    implicitKey
  } = ctx;

  if (implicitKey) {
    if (/\n/.test(value)) return doubleQuotedString(value, ctx);
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx);
  }

  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'";
  return implicitKey ? res : (0, _foldFlowLines.default)(res, indent, _foldFlowLines.FOLD_FLOW, _options.strOptions.fold);
}

function blockString({
  comment,
  type,
  value
}, ctx, onComment, onChompKeep) {
  // 1. Block can't end in whitespace unless the last line is non-empty.
  // 2. Strings consisting of only whitespace are best rendered explicitly.
  if (/\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
    return doubleQuotedString(value, ctx);
  }

  const indent = ctx.indent || (ctx.forceBlockIndent ? ' ' : '');
  const indentSize = indent ? '2' : '1'; // root is at -1

  const literal = type === _constants.Type.BLOCK_FOLDED ? false : type === _constants.Type.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, _options.strOptions.fold.lineWidth - indent.length);
  let header = literal ? '|' : '>';
  if (!value) return header + '\n';
  let wsStart = '';
  let wsEnd = '';
  value = value.replace(/[\n\t ]*$/, ws => {
    const n = ws.indexOf('\n');

    if (n === -1) {
      header += '-'; // strip
    } else if (value === ws || n !== ws.length - 1) {
      header += '+'; // keep

      if (onChompKeep) onChompKeep();
    }

    wsEnd = ws.replace(/\n$/, '');
    return '';
  }).replace(/^[\n ]*/, ws => {
    if (ws.indexOf(' ') !== -1) header += indentSize;
    const m = ws.match(/ +$/);

    if (m) {
      wsStart = ws.slice(0, -m[0].length);
      return m[0];
    } else {
      wsStart = ws;
      return '';
    }
  });
  if (wsEnd) wsEnd = wsEnd.replace(/\n+(?!\n|$)/g, `$&${indent}`);
  if (wsStart) wsStart = wsStart.replace(/\n+/g, `$&${indent}`);

  if (comment) {
    header += ' #' + comment.replace(/ ?[\r\n]+/g, ' ');
    if (onComment) onComment();
  }

  if (!value) return `${header}${indentSize}\n${indent}${wsEnd}`;

  if (literal) {
    value = value.replace(/\n+/g, `$&${indent}`);
    return `${header}\n${indent}${wsStart}${value}${wsEnd}`;
  }

  value = value.replace(/\n+/g, '\n$&').replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
  //         ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
  .replace(/\n+/g, `$&${indent}`);
  const body = (0, _foldFlowLines.default)(`${wsStart}${value}${wsEnd}`, indent, _foldFlowLines.FOLD_BLOCK, _options.strOptions.fold);
  return `${header}\n${indent}${body}`;
}

function plainString(item, ctx, onComment, onChompKeep) {
  const {
    comment,
    type,
    value
  } = item;
  const {
    actualString,
    implicitKey,
    indent,
    inFlow,
    tags
  } = ctx;

  if (implicitKey && /[\n[\]{},]/.test(value) || inFlow && /[[\]{},]/.test(value)) {
    return doubleQuotedString(value, ctx);
  }

  if (!value || /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
    // not allowed:
    // - empty string, '-' or '?'
    // - start with an indicator character (except [?:-]) or /[?-] /
    // - '\n ', ': ' or ' \n' anywhere
    // - '#' not preceded by a non-space char
    // - end with ' ' or ':'
    return implicitKey || inFlow || value.indexOf('\n') === -1 ? value.indexOf('"') !== -1 && value.indexOf("'") === -1 ? singleQuotedString(value, ctx) : doubleQuotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  }

  if (!implicitKey && !inFlow && type !== _constants.Type.PLAIN && value.indexOf('\n') !== -1) {
    // Where allowed & type not set explicitly, prefer block style for multiline strings
    return blockString(item, ctx, onComment, onChompKeep);
  }

  const str = value.replace(/\n+/g, `$&\n${indent}`); // Verify that output will be parsed as a string, as e.g. plain numbers and
  // booleans get parsed with those types in v1.2 (e.g. '42', 'true' & '0.9e-3'),
  // and others in v1.1.

  if (actualString && typeof tags.resolveScalar(str).value !== 'string') {
    return doubleQuotedString(value, ctx);
  }

  const body = implicitKey ? str : (0, _foldFlowLines.default)(str, indent, _foldFlowLines.FOLD_FLOW, _options.strOptions.fold);

  if (comment && !inFlow && (body.indexOf('\n') !== -1 || comment.indexOf('\n') !== -1)) {
    if (onComment) onComment();
    return (0, _addComment.addCommentBefore)(body, indent, comment);
  }

  return body;
}

function stringifyString(item, ctx, onComment, onChompKeep) {
  const {
    defaultType
  } = _options.strOptions;
  const {
    implicitKey,
    inFlow
  } = ctx;
  let {
    type,
    value
  } = item;

  if (typeof value !== 'string') {
    value = String(value);
    item = Object.assign({}, item, {
      value
    });
  }

  const _stringify = _type => {
    switch (_type) {
      case _constants.Type.BLOCK_FOLDED:
      case _constants.Type.BLOCK_LITERAL:
        return blockString(item, ctx, onComment, onChompKeep);

      case _constants.Type.QUOTE_DOUBLE:
        return doubleQuotedString(value, ctx);

      case _constants.Type.QUOTE_SINGLE:
        return singleQuotedString(value, ctx);

      case _constants.Type.PLAIN:
        return plainString(item, ctx, onComment, onChompKeep);

      default:
        return null;
    }
  };

  if (type !== _constants.Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)) {
    // force double quotes on control characters
    type = _constants.Type.QUOTE_DOUBLE;
  } else if ((implicitKey || inFlow) && (type === _constants.Type.BLOCK_FOLDED || type === _constants.Type.BLOCK_LITERAL)) {
    // should not happen; blocks are not valid inside flow containers
    type = _constants.Type.QUOTE_DOUBLE;
  }

  let res = _stringify(type);

  if (res === null) {
    res = _stringify(defaultType);
    if (res === null) throw new Error(`Unsupported default string type ${defaultType}`);
  }

  return res;
}

/***/ }),

/***/ 470:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __webpack_require__(431);
const os = __webpack_require__(87);
const path = __webpack_require__(622);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable
 */
function exportVariable(name, val) {
    process.env[name] = val;
    command_1.issueCommand('set-env', { name }, val);
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    command_1.issueCommand('add-path', {}, inputPath);
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store
 */
function setOutput(name, value) {
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message
 */
function error(message) {
    command_1.issue('error', message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message
 */
function warning(message) {
    command_1.issue('warning', message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store
 */
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 487:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Comment extends _Node.default {
  constructor() {
    super(_constants.Type.COMMENT);
  }
  /**
   * Parses a comment line from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */


  parse(context, start) {
    this.context = context;
    const offset = this.parseComment(start);
    this.range = new _Range.default(start, offset);
    return offset;
  }

}

exports.default = Comment;

/***/ }),

/***/ 514:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Alias = _interopRequireDefault(__webpack_require__(637));

var _Map = _interopRequireDefault(__webpack_require__(684));

var _Merge = _interopRequireDefault(__webpack_require__(386));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _Seq = _interopRequireDefault(__webpack_require__(29));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Anchors {
  static validAnchorNode(node) {
    return node instanceof _Scalar.default || node instanceof _Seq.default || node instanceof _Map.default;
  }

  constructor(prefix) {
    _defineProperty(this, "map", {});

    this.prefix = prefix;
  }

  createAlias(node, name) {
    this.setAnchor(node, name);
    return new _Alias.default(node);
  }

  createMergePair(...sources) {
    const merge = new _Merge.default();
    merge.value.items = sources.map(s => {
      if (s instanceof _Alias.default) {
        if (s.source instanceof _Map.default) return s;
      } else if (s instanceof _Map.default) {
        return this.createAlias(s);
      }

      throw new Error('Merge sources must be Map nodes or their Aliases');
    });
    return merge;
  }

  getName(node) {
    const {
      map
    } = this;
    return Object.keys(map).find(a => map[a] === node);
  }

  getNode(name) {
    return this.map[name];
  }

  newName(prefix) {
    if (!prefix) prefix = this.prefix;
    const names = Object.keys(this.map);

    for (let i = 1; true; ++i) {
      const name = `${prefix}${i}`;
      if (!names.includes(name)) return name;
    }
  } // During parsing, map & aliases contain CST nodes


  resolveNodes() {
    const {
      map,
      _cstAliases
    } = this;
    Object.keys(map).forEach(a => {
      map[a] = map[a].resolved;
    });

    _cstAliases.forEach(a => {
      a.source = a.source.resolved;
    });

    delete this._cstAliases;
  }

  setAnchor(node, name) {
    if (node != null && !Anchors.validAnchorNode(node)) {
      throw new Error('Anchors may only be set for Scalar, Seq and Map nodes');
    }

    if (name && /[\x00-\x19\s,[\]{}]/.test(name)) {
      throw new Error('Anchor names must not contain whitespace or control characters');
    }

    const {
      map
    } = this;
    const prev = node && Object.keys(map).find(a => map[a] === node);

    if (prev) {
      if (!name) {
        return prev;
      } else if (prev !== name) {
        delete map[prev];
        map[name] = node;
      }
    } else {
      if (!name) {
        if (!node) return null;
        name = this.newName();
      }

      map[name] = node;
    }

    return name;
  }

}

exports.default = Anchors;

/***/ }),

/***/ 515:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toJSON = _interopRequireDefault(__webpack_require__(923));

var _Node = _interopRequireDefault(__webpack_require__(156));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Published as 'yaml/scalar'
class Scalar extends _Node.default {
  constructor(value) {
    super();
    this.value = value;
  }

  toJSON(arg, ctx) {
    return ctx && ctx.keep ? this.value : (0, _toJSON.default)(this.value, arg, ctx);
  }

  toString() {
    return String(this.value);
  }

}

exports.default = Scalar;

/***/ }),

/***/ 521:
/***/ (function(module, __unusedexports, __webpack_require__) {

module.exports = __webpack_require__(792).default


/***/ }),

/***/ 550:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _stringify = __webpack_require__(454);

var _failsafe = _interopRequireDefault(__webpack_require__(195));

var _options = __webpack_require__(422);

var _binary = _interopRequireDefault(__webpack_require__(996));

var _omap = _interopRequireDefault(__webpack_require__(821));

var _pairs = _interopRequireDefault(__webpack_require__(566));

var _set = _interopRequireDefault(__webpack_require__(785));

var _timestamp = __webpack_require__(414);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _failsafe.default.concat([{
  identify: value => value == null,
  createNode: (schema, value, ctx) => ctx.wrapScalars ? new _Scalar.default(null) : null,
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => null,
  options: _options.nullOptions,
  stringify: () => _options.nullOptions.nullStr
}, {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => true,
  options: _options.boolOptions,
  stringify: ({
    value
  }) => value ? _options.boolOptions.trueStr : _options.boolOptions.falseStr
}, {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
  resolve: () => false,
  options: _options.boolOptions,
  stringify: ({
    value
  }) => value ? _options.boolOptions.trueStr : _options.boolOptions.falseStr
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'BIN',
  test: /^0b([0-1_]+)$/,
  resolve: (str, bin) => parseInt(bin.replace(/_/g, ''), 2),
  stringify: ({
    value
  }) => '0b' + value.toString(2)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^[-+]?0([0-7_]+)$/,
  resolve: (str, oct) => parseInt(oct.replace(/_/g, ''), 8),
  stringify: ({
    value
  }) => (value < 0 ? '-0' : '0') + value.toString(8)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: str => parseInt(str.replace(/_/g, ''), 10),
  stringify: _stringify.stringifyNumber
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x([0-9a-fA-F_]+)$/,
  resolve: (str, hex) => parseInt(hex.replace(/_/g, ''), 16),
  stringify: ({
    value
  }) => (value < 0 ? '-0x' : '0x') + value.toString(16)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: (str, nan) => nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: _stringify.stringifyNumber
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'EXP',
  test: /^[-+]?([0-9][0-9_]*)?(\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: str => parseFloat(str.replace(/_/g, '')),
  stringify: ({
    value
  }) => Number(value).toExponential()
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(?:[0-9][0-9_]*)?\.([0-9_]*)$/,

  resolve(str, frac) {
    const node = new _Scalar.default(parseFloat(str.replace(/_/g, '')));

    if (frac) {
      const f = frac.replace(/_/g, '');
      if (f[f.length - 1] === '0') node.minFractionDigits = f.length;
    }

    return node;
  },

  stringify: _stringify.stringifyNumber
}], _binary.default, _omap.default, _pairs.default, _set.default, _timestamp.intTime, _timestamp.floatTime, _timestamp.timestamp);

exports.default = _default;

/***/ }),

/***/ 566:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsePairs = parsePairs;
exports.createPairs = createPairs;
exports.default = void 0;

var _errors = __webpack_require__(405);

var _Map = _interopRequireDefault(__webpack_require__(684));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _parseSeq = _interopRequireDefault(__webpack_require__(858));

var _Seq = _interopRequireDefault(__webpack_require__(29));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parsePairs(doc, cst) {
  const seq = (0, _parseSeq.default)(doc, cst);

  for (let i = 0; i < seq.items.length; ++i) {
    let item = seq.items[i];
    if (item instanceof _Pair.default) continue;else if (item instanceof _Map.default) {
      if (item.items.length > 1) {
        const msg = 'Each pair must have its own sequence indicator';
        throw new _errors.YAMLSemanticError(cst, msg);
      }

      const pair = item.items[0] || new _Pair.default();
      if (item.commentBefore) pair.commentBefore = pair.commentBefore ? `${item.commentBefore}\n${pair.commentBefore}` : item.commentBefore;
      if (item.comment) pair.comment = pair.comment ? `${item.comment}\n${pair.comment}` : item.comment;
      item = pair;
    }
    seq.items[i] = item instanceof _Pair.default ? item : new _Pair.default(item);
  }

  return seq;
}

function createPairs(schema, iterable, ctx) {
  const pairs = new _Seq.default();
  pairs.tag = 'tag:yaml.org,2002:pairs';

  for (const it of iterable) {
    let key, value;

    if (Array.isArray(it)) {
      if (it.length === 2) {
        key = it[0];
        value = it[1];
      } else throw new TypeError(`Expected [key, value] tuple: ${it}`);
    } else if (it && it instanceof Object) {
      const keys = Object.keys(it);

      if (keys.length === 1) {
        key = keys[0];
        value = it[key];
      } else throw new TypeError(`Expected { key: value } tuple: ${it}`);
    } else {
      key = it;
    }

    const pair = schema.createPair(key, value, ctx);
    pairs.items.push(pair);
  }

  return pairs;
}

var _default = {
  default: false,
  tag: 'tag:yaml.org,2002:pairs',
  resolve: parsePairs,
  createNode: createPairs
};
exports.default = _default;

/***/ }),

/***/ 570:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _addComment = _interopRequireDefault(__webpack_require__(836));

var _Anchors = _interopRequireDefault(__webpack_require__(514));

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _listTagNames = _interopRequireDefault(__webpack_require__(880));

var _schema = _interopRequireDefault(__webpack_require__(255));

var _Alias = _interopRequireDefault(__webpack_require__(637));

var _Collection = _interopRequireWildcard(__webpack_require__(380));

var _Node = _interopRequireDefault(__webpack_require__(156));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _toJSON = _interopRequireDefault(__webpack_require__(923));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const isCollectionItem = node => node && [_constants.Type.MAP_KEY, _constants.Type.MAP_VALUE, _constants.Type.SEQ_ITEM].includes(node.type);

class Document {
  constructor(options) {
    this.anchors = new _Anchors.default(options.anchorPrefix);
    this.commentBefore = null;
    this.comment = null;
    this.contents = null;
    this.directivesEndMarker = null;
    this.errors = [];
    this.options = options;
    this.schema = null;
    this.tagPrefixes = [];
    this.version = null;
    this.warnings = [];
  }

  assertCollectionContents() {
    if (this.contents instanceof _Collection.default) return true;
    throw new Error('Expected a YAML collection as document contents');
  }

  add(value) {
    this.assertCollectionContents();
    return this.contents.add(value);
  }

  addIn(path, value) {
    this.assertCollectionContents();
    this.contents.addIn(path, value);
  }

  delete(key) {
    this.assertCollectionContents();
    return this.contents.delete(key);
  }

  deleteIn(path) {
    if ((0, _Collection.isEmptyPath)(path)) {
      if (this.contents == null) return false;
      this.contents = null;
      return true;
    }

    this.assertCollectionContents();
    return this.contents.deleteIn(path);
  }

  getDefaults() {
    return Document.defaults[this.version] || Document.defaults[this.options.version] || {};
  }

  get(key, keepScalar) {
    return this.contents instanceof _Collection.default ? this.contents.get(key, keepScalar) : undefined;
  }

  getIn(path, keepScalar) {
    if ((0, _Collection.isEmptyPath)(path)) return !keepScalar && this.contents instanceof _Scalar.default ? this.contents.value : this.contents;
    return this.contents instanceof _Collection.default ? this.contents.getIn(path, keepScalar) : undefined;
  }

  has(key) {
    return this.contents instanceof _Collection.default ? this.contents.has(key) : false;
  }

  hasIn(path) {
    if ((0, _Collection.isEmptyPath)(path)) return this.contents !== undefined;
    return this.contents instanceof _Collection.default ? this.contents.hasIn(path) : false;
  }

  set(key, value) {
    this.assertCollectionContents();
    this.contents.set(key, value);
  }

  setIn(path, value) {
    if ((0, _Collection.isEmptyPath)(path)) this.contents = value;else {
      this.assertCollectionContents();
      this.contents.setIn(path, value);
    }
  }

  setSchema(id, customTags) {
    if (!id && !customTags && this.schema) return;
    if (typeof id === 'number') id = id.toFixed(1);

    if (id === '1.0' || id === '1.1' || id === '1.2') {
      if (this.version) this.version = id;else this.options.version = id;
      delete this.options.schema;
    } else if (id && typeof id === 'string') {
      this.options.schema = id;
    }

    if (Array.isArray(customTags)) this.options.customTags = customTags;
    const opt = Object.assign({}, this.getDefaults(), this.options);
    this.schema = new _schema.default(opt);
  }

  parse(node, prevDoc) {
    if (this.options.keepCstNodes) this.cstNode = node;
    if (this.options.keepNodeTypes) this.type = 'DOCUMENT';
    const {
      directives = [],
      contents = [],
      directivesEndMarker,
      error,
      valueRange
    } = node;

    if (error) {
      if (!error.source) error.source = this;
      this.errors.push(error);
    }

    this.parseDirectives(directives, prevDoc);
    if (directivesEndMarker) this.directivesEndMarker = true;
    this.range = valueRange ? [valueRange.start, valueRange.end] : null;
    this.setSchema();
    this.anchors._cstAliases = [];
    this.parseContents(contents);
    this.anchors.resolveNodes();

    if (this.options.prettyErrors) {
      for (const error of this.errors) if (error instanceof _errors.YAMLError) error.makePretty();

      for (const warn of this.warnings) if (warn instanceof _errors.YAMLError) warn.makePretty();
    }

    return this;
  }

  parseDirectives(directives, prevDoc) {
    const directiveComments = [];
    let hasDirectives = false;
    directives.forEach(directive => {
      const {
        comment,
        name
      } = directive;

      switch (name) {
        case 'TAG':
          this.resolveTagDirective(directive);
          hasDirectives = true;
          break;

        case 'YAML':
        case 'YAML:1.0':
          this.resolveYamlDirective(directive);
          hasDirectives = true;
          break;

        default:
          if (name) {
            const msg = `YAML only supports %TAG and %YAML directives, and not %${name}`;
            this.warnings.push(new _errors.YAMLWarning(directive, msg));
          }

      }

      if (comment) directiveComments.push(comment);
    });

    if (prevDoc && !hasDirectives && '1.1' === (this.version || prevDoc.version || this.options.version)) {
      const copyTagPrefix = ({
        handle,
        prefix
      }) => ({
        handle,
        prefix
      });

      this.tagPrefixes = prevDoc.tagPrefixes.map(copyTagPrefix);
      this.version = prevDoc.version;
    }

    this.commentBefore = directiveComments.join('\n') || null;
  }

  parseContents(contents) {
    const comments = {
      before: [],
      after: []
    };
    const contentNodes = [];
    let spaceBefore = false;
    contents.forEach(node => {
      if (node.valueRange) {
        if (contentNodes.length === 1) {
          const msg = 'Document is not valid YAML (bad indentation?)';
          this.errors.push(new _errors.YAMLSyntaxError(node, msg));
        }

        const res = this.resolveNode(node);

        if (spaceBefore) {
          res.spaceBefore = true;
          spaceBefore = false;
        }

        contentNodes.push(res);
      } else if (node.comment !== null) {
        const cc = contentNodes.length === 0 ? comments.before : comments.after;
        cc.push(node.comment);
      } else if (node.type === _constants.Type.BLANK_LINE) {
        spaceBefore = true;

        if (contentNodes.length === 0 && comments.before.length > 0 && !this.commentBefore) {
          // space-separated comments at start are parsed as document comments
          this.commentBefore = comments.before.join('\n');
          comments.before = [];
        }
      }
    });

    switch (contentNodes.length) {
      case 0:
        this.contents = null;
        comments.after = comments.before;
        break;

      case 1:
        this.contents = contentNodes[0];

        if (this.contents) {
          const cb = comments.before.join('\n') || null;

          if (cb) {
            const cbNode = this.contents instanceof _Collection.default && this.contents.items[0] ? this.contents.items[0] : this.contents;
            cbNode.commentBefore = cbNode.commentBefore ? `${cb}\n${cbNode.commentBefore}` : cb;
          }
        } else {
          comments.after = comments.before.concat(comments.after);
        }

        break;

      default:
        this.contents = contentNodes;

        if (this.contents[0]) {
          this.contents[0].commentBefore = comments.before.join('\n') || null;
        } else {
          comments.after = comments.before.concat(comments.after);
        }

    }

    this.comment = comments.after.join('\n') || null;
  }

  resolveTagDirective(directive) {
    const [handle, prefix] = directive.parameters;

    if (handle && prefix) {
      if (this.tagPrefixes.every(p => p.handle !== handle)) {
        this.tagPrefixes.push({
          handle,
          prefix
        });
      } else {
        const msg = 'The %TAG directive must only be given at most once per handle in the same document.';
        this.errors.push(new _errors.YAMLSemanticError(directive, msg));
      }
    } else {
      const msg = 'Insufficient parameters given for %TAG directive';
      this.errors.push(new _errors.YAMLSemanticError(directive, msg));
    }
  }

  resolveYamlDirective(directive) {
    let [version] = directive.parameters;
    if (directive.name === 'YAML:1.0') version = '1.0';

    if (this.version) {
      const msg = 'The %YAML directive must only be given at most once per document.';
      this.errors.push(new _errors.YAMLSemanticError(directive, msg));
    }

    if (!version) {
      const msg = 'Insufficient parameters given for %YAML directive';
      this.errors.push(new _errors.YAMLSemanticError(directive, msg));
    } else {
      if (!Document.defaults[version]) {
        const v0 = this.version || this.options.version;
        const msg = `Document will be parsed as YAML ${v0} rather than YAML ${version}`;
        this.warnings.push(new _errors.YAMLWarning(directive, msg));
      }

      this.version = version;
    }
  }

  resolveTagName(node) {
    const {
      tag,
      type
    } = node;
    let nonSpecific = false;

    if (tag) {
      const {
        handle,
        suffix,
        verbatim
      } = tag;

      if (verbatim) {
        if (verbatim !== '!' && verbatim !== '!!') return verbatim;
        const msg = `Verbatim tags aren't resolved, so ${verbatim} is invalid.`;
        this.errors.push(new _errors.YAMLSemanticError(node, msg));
      } else if (handle === '!' && !suffix) {
        nonSpecific = true;
      } else {
        let prefix = this.tagPrefixes.find(p => p.handle === handle);

        if (!prefix) {
          const dtp = this.getDefaults().tagPrefixes;
          if (dtp) prefix = dtp.find(p => p.handle === handle);
        }

        if (prefix) {
          if (suffix) {
            if (handle === '!' && (this.version || this.options.version) === '1.0') {
              if (suffix[0] === '^') return suffix;

              if (/[:/]/.test(suffix)) {
                // word/foo -> tag:word.yaml.org,2002:foo
                const vocab = suffix.match(/^([a-z0-9-]+)\/(.*)/i);
                return vocab ? `tag:${vocab[1]}.yaml.org,2002:${vocab[2]}` : `tag:${suffix}`;
              }
            }

            return prefix.prefix + decodeURIComponent(suffix);
          }

          this.errors.push(new _errors.YAMLSemanticError(node, `The ${handle} tag has no suffix.`));
        } else {
          const msg = `The ${handle} tag handle is non-default and was not declared.`;
          this.errors.push(new _errors.YAMLSemanticError(node, msg));
        }
      }
    }

    switch (type) {
      case _constants.Type.BLOCK_FOLDED:
      case _constants.Type.BLOCK_LITERAL:
      case _constants.Type.QUOTE_DOUBLE:
      case _constants.Type.QUOTE_SINGLE:
        return _schema.default.defaultTags.STR;

      case _constants.Type.FLOW_MAP:
      case _constants.Type.MAP:
        return _schema.default.defaultTags.MAP;

      case _constants.Type.FLOW_SEQ:
      case _constants.Type.SEQ:
        return _schema.default.defaultTags.SEQ;

      case _constants.Type.PLAIN:
        return nonSpecific ? _schema.default.defaultTags.STR : null;

      default:
        return null;
    }
  }

  resolveNode(node) {
    if (!node) return null;
    const {
      anchors,
      errors,
      schema
    } = this;
    let hasAnchor = false;
    let hasTag = false;
    const comments = {
      before: [],
      after: []
    };
    const props = isCollectionItem(node.context.parent) ? node.context.parent.props.concat(node.props) : node.props;

    for (const {
      start,
      end
    } of props) {
      switch (node.context.src[start]) {
        case _constants.Char.COMMENT:
          {
            if (!node.commentHasRequiredWhitespace(start)) {
              const msg = 'Comments must be separated from other tokens by white space characters';
              errors.push(new _errors.YAMLSemanticError(node, msg));
            }

            const c = node.context.src.slice(start + 1, end);
            const {
              header,
              valueRange
            } = node;

            if (valueRange && (start > valueRange.start || header && start > header.start)) {
              comments.after.push(c);
            } else {
              comments.before.push(c);
            }
          }
          break;

        case _constants.Char.ANCHOR:
          if (hasAnchor) {
            const msg = 'A node can have at most one anchor';
            errors.push(new _errors.YAMLSemanticError(node, msg));
          }

          hasAnchor = true;
          break;

        case _constants.Char.TAG:
          if (hasTag) {
            const msg = 'A node can have at most one tag';
            errors.push(new _errors.YAMLSemanticError(node, msg));
          }

          hasTag = true;
          break;
      }
    }

    if (hasAnchor) {
      const name = node.anchor;
      const prev = anchors.getNode(name); // At this point, aliases for any preceding node with the same anchor
      // name have already been resolved, so it may safely be renamed.

      if (prev) anchors.map[anchors.newName(name)] = prev; // During parsing, we need to store the CST node in anchors.map as
      // anchors need to be available during resolution to allow for
      // circular references.

      anchors.map[name] = node;
    }

    let res;

    if (node.type === _constants.Type.ALIAS) {
      if (hasAnchor || hasTag) {
        const msg = 'An alias node must not specify any properties';
        errors.push(new _errors.YAMLSemanticError(node, msg));
      }

      const name = node.rawValue;
      const src = anchors.getNode(name);

      if (!src) {
        const msg = `Aliased anchor not found: ${name}`;
        errors.push(new _errors.YAMLReferenceError(node, msg));
        return null;
      } // Lazy resolution for circular references


      res = new _Alias.default(src);

      anchors._cstAliases.push(res);
    } else {
      const tagName = this.resolveTagName(node);

      if (tagName) {
        res = schema.resolveNodeWithFallback(this, node, tagName);
      } else {
        if (node.type !== _constants.Type.PLAIN) {
          const msg = `Failed to resolve ${node.type} node here`;
          errors.push(new _errors.YAMLSyntaxError(node, msg));
          return null;
        }

        try {
          res = schema.resolveScalar(node.strValue || '');
        } catch (error) {
          if (!error.source) error.source = node;
          errors.push(error);
          return null;
        }
      }
    }

    if (res) {
      res.range = [node.range.start, node.range.end];
      if (this.options.keepCstNodes) res.cstNode = node;
      if (this.options.keepNodeTypes) res.type = node.type;
      const cb = comments.before.join('\n');

      if (cb) {
        res.commentBefore = res.commentBefore ? `${res.commentBefore}\n${cb}` : cb;
      }

      const ca = comments.after.join('\n');
      if (ca) res.comment = res.comment ? `${res.comment}\n${ca}` : ca;
    }

    return node.resolved = res;
  }

  listNonDefaultTags() {
    return (0, _listTagNames.default)(this.contents).filter(t => t.indexOf(_schema.default.defaultPrefix) !== 0);
  }

  setTagPrefix(handle, prefix) {
    if (handle[0] !== '!' || handle[handle.length - 1] !== '!') throw new Error('Handle must start and end with !');

    if (prefix) {
      const prev = this.tagPrefixes.find(p => p.handle === handle);
      if (prev) prev.prefix = prefix;else this.tagPrefixes.push({
        handle,
        prefix
      });
    } else {
      this.tagPrefixes = this.tagPrefixes.filter(p => p.handle !== handle);
    }
  }

  stringifyTag(tag) {
    if ((this.version || this.options.version) === '1.0') {
      const priv = tag.match(/^tag:private\.yaml\.org,2002:([^:/]+)$/);
      if (priv) return '!' + priv[1];
      const vocab = tag.match(/^tag:([a-zA-Z0-9-]+)\.yaml\.org,2002:(.*)/);
      return vocab ? `!${vocab[1]}/${vocab[2]}` : `!${tag.replace(/^tag:/, '')}`;
    } else {
      let p = this.tagPrefixes.find(p => tag.indexOf(p.prefix) === 0);

      if (!p) {
        const dtp = this.getDefaults().tagPrefixes;
        p = dtp && dtp.find(p => tag.indexOf(p.prefix) === 0);
      }

      if (!p) return tag[0] === '!' ? tag : `!<${tag}>`;
      const suffix = tag.substr(p.prefix.length).replace(/[!,[\]{}]/g, ch => ({
        '!': '%21',
        ',': '%2C',
        '[': '%5B',
        ']': '%5D',
        '{': '%7B',
        '}': '%7D'
      })[ch]);
      return p.handle + suffix;
    }
  }

  toJSON(arg) {
    const {
      keepBlobsInJSON,
      mapAsMap,
      maxAliasCount
    } = this.options;
    const keep = keepBlobsInJSON && (typeof arg !== 'string' || !(this.contents instanceof _Scalar.default));
    const ctx = {
      doc: this,
      keep,
      mapAsMap: keep && !!mapAsMap,
      maxAliasCount
    };
    const anchorNames = Object.keys(this.anchors.map);
    if (anchorNames.length > 0) ctx.anchors = anchorNames.map(name => ({
      alias: [],
      aliasCount: 0,
      count: 1,
      node: this.anchors.map[name]
    }));
    return (0, _toJSON.default)(this.contents, arg, ctx);
  }

  toString() {
    if (this.errors.length > 0) throw new Error('Document with errors cannot be stringified');
    this.setSchema();
    const lines = [];
    let hasDirectives = false;

    if (this.version) {
      let vd = '%YAML 1.2';

      if (this.schema.name === 'yaml-1.1') {
        if (this.version === '1.0') vd = '%YAML:1.0';else if (this.version === '1.1') vd = '%YAML 1.1';
      }

      lines.push(vd);
      hasDirectives = true;
    }

    const tagNames = this.listNonDefaultTags();
    this.tagPrefixes.forEach(({
      handle,
      prefix
    }) => {
      if (tagNames.some(t => t.indexOf(prefix) === 0)) {
        lines.push(`%TAG ${handle} ${prefix}`);
        hasDirectives = true;
      }
    });
    if (hasDirectives || this.directivesEndMarker) lines.push('---');

    if (this.commentBefore) {
      if (hasDirectives || !this.directivesEndMarker) lines.unshift('');
      lines.unshift(this.commentBefore.replace(/^/gm, '#'));
    }

    const ctx = {
      anchors: {},
      doc: this,
      indent: ''
    };
    let chompKeep = false;
    let contentComment = null;

    if (this.contents) {
      if (this.contents instanceof _Node.default) {
        if (this.contents.spaceBefore && (hasDirectives || this.directivesEndMarker)) lines.push('');
        if (this.contents.commentBefore) lines.push(this.contents.commentBefore.replace(/^/gm, '#')); // top-level block scalars need to be indented if followed by a comment

        ctx.forceBlockIndent = !!this.comment;
        contentComment = this.contents.comment;
      }

      const onChompKeep = contentComment ? null : () => chompKeep = true;
      const body = this.schema.stringify(this.contents, ctx, () => contentComment = null, onChompKeep);
      lines.push((0, _addComment.default)(body, '', contentComment));
    } else if (this.contents !== undefined) {
      lines.push(this.schema.stringify(this.contents, ctx));
    }

    if (this.comment) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '') lines.push('');
      lines.push(this.comment.replace(/^/gm, '#'));
    }

    return lines.join('\n') + '\n';
  }

}

exports.default = Document;

_defineProperty(Document, "defaults", {
  '1.0': {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [{
      handle: '!',
      prefix: _schema.default.defaultPrefix
    }, {
      handle: '!!',
      prefix: 'tag:private.yaml.org,2002:'
    }]
  },
  '1.1': {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [{
      handle: '!',
      prefix: '!'
    }, {
      handle: '!!',
      prefix: _schema.default.defaultPrefix
    }]
  },
  '1.2': {
    schema: 'core',
    merge: false,
    tagPrefixes: [{
      handle: '!',
      prefix: '!'
    }, {
      handle: '!!',
      prefix: _schema.default.defaultPrefix
    }]
  }
});

/***/ }),

/***/ 591:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.resolveString = void 0;

var _stringify = __webpack_require__(454);

var _options = __webpack_require__(422);

const resolveString = (doc, node) => {
  // on error, will return { str: string, errors: Error[] }
  const res = node.strValue;
  if (!res) return '';
  if (typeof res === 'string') return res;
  res.errors.forEach(error => {
    if (!error.source) error.source = node;
    doc.errors.push(error);
  });
  return res.str;
};

exports.resolveString = resolveString;
var _default = {
  identify: value => typeof value === 'string',
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: resolveString,

  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({
      actualString: true
    }, ctx);
    return (0, _stringify.stringifyString)(item, ctx, onComment, onChompKeep);
  },

  options: _options.strOptions
};
exports.default = _default;

/***/ }),

/***/ 614:
/***/ (function(module) {

module.exports = require("events");

/***/ }),

/***/ 622:
/***/ (function(module) {

module.exports = require("path");

/***/ }),

/***/ 637:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _toJSON = _interopRequireDefault(__webpack_require__(923));

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Node = _interopRequireDefault(__webpack_require__(156));

var _Pair = _interopRequireDefault(__webpack_require__(325));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const getAliasCount = (node, anchors) => {
  if (node instanceof Alias) {
    const anchor = anchors.find(a => a.node === node.source);
    return anchor.count * anchor.aliasCount;
  } else if (node instanceof _Collection.default) {
    let count = 0;

    for (const item of node.items) {
      const c = getAliasCount(item, anchors);
      if (c > count) count = c;
    }

    return count;
  } else if (node instanceof _Pair.default) {
    const kc = getAliasCount(node.key, anchors);
    const vc = getAliasCount(node.value, anchors);
    return Math.max(kc, vc);
  }

  return 1;
};

class Alias extends _Node.default {
  static stringify({
    range,
    source
  }, {
    anchors,
    doc,
    implicitKey,
    inStringifyKey
  }) {
    let anchor = Object.keys(anchors).find(a => anchors[a] === source);
    if (!anchor && inStringifyKey) anchor = doc.anchors.getName(source) || doc.anchors.newName();
    if (anchor) return `*${anchor}${implicitKey ? ' ' : ''}`;
    const msg = doc.anchors.getName(source) ? 'Alias node must be after source node' : 'Source node not found for alias node';
    throw new Error(`${msg} [${range}]`);
  }

  constructor(source) {
    super();
    this.source = source;
    this.type = _constants.Type.ALIAS;
  }

  set tag(t) {
    throw new Error('Alias nodes cannot have tags');
  }

  toJSON(arg, ctx) {
    if (!ctx) return (0, _toJSON.default)(this.source, arg, ctx);
    const {
      anchors,
      maxAliasCount
    } = ctx;
    const anchor = anchors.find(a => a.node === this.source);

    if (!anchor || anchor.res === undefined) {
      const msg = 'This should not happen: Alias anchor was not resolved?';
      if (this.cstNode) throw new _errors.YAMLReferenceError(this.cstNode, msg);else throw new ReferenceError(msg);
    }

    if (maxAliasCount >= 0) {
      anchor.count += 1;
      if (anchor.aliasCount === 0) anchor.aliasCount = getAliasCount(this.source, anchors);

      if (anchor.count * anchor.aliasCount > maxAliasCount) {
        const msg = 'Excessive alias count indicates a resource exhaustion attack';
        if (this.cstNode) throw new _errors.YAMLReferenceError(this.cstNode, msg);else throw new ReferenceError(msg);
      }
    }

    return anchor.res;
  } // Only called when stringifying an alias mapping key while constructing
  // Object output.


  toString(ctx) {
    return Alias.stringify(this, ctx);
  }

}

exports.default = Alias;

_defineProperty(Alias, "default", true);

/***/ }),

/***/ 641:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Directive extends _Node.default {
  static endOfDirective(src, offset) {
    let ch = src[offset];

    while (ch && ch !== '\n' && ch !== '#') ch = src[offset += 1]; // last char can't be whitespace


    ch = src[offset - 1];

    while (ch === ' ' || ch === '\t') {
      offset -= 1;
      ch = src[offset - 1];
    }

    return offset;
  }

  constructor() {
    super(_constants.Type.DIRECTIVE);
    this.name = null;
  }

  get parameters() {
    const raw = this.rawValue;
    return raw ? raw.trim().split(/[ \t]+/) : [];
  }

  parseName(start) {
    const {
      src
    } = this.context;
    let offset = start;
    let ch = src[offset];

    while (ch && ch !== '\n' && ch !== '\t' && ch !== ' ') ch = src[offset += 1];

    this.name = src.slice(start, offset);
    return offset;
  }

  parseParameters(start) {
    const {
      src
    } = this.context;
    let offset = start;
    let ch = src[offset];

    while (ch && ch !== '\n' && ch !== '#') ch = src[offset += 1];

    this.valueRange = new _Range.default(start, offset);
    return offset;
  }

  parse(context, start) {
    this.context = context;
    let offset = this.parseName(start + 1);
    offset = this.parseParameters(offset);
    offset = this.parseComment(offset);
    this.range = new _Range.default(start, offset);
    return offset;
  }

}

exports.default = Directive;

/***/ }),

/***/ 676:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const exec = __webpack_require__(986)
const core = __webpack_require__(470)
const { parse } = __webpack_require__(521)
const { readFileSync } = __webpack_require__(747)
const { join } = __webpack_require__(622)

const GITHUB_TOKEN = core.getInput('repo-token', { required: true })
const GITHUB_REPO = core.getInput('repo-name', { required: true })
const WORKING_DIR = './.private-action'

async function run () {
  const { repo, sha } = parseRepo()

  core.info('Masking token just in case')
  core.setSecret(GITHUB_TOKEN)

  core.startGroup('Cloning private action')
  const repoUrl = `https://${GITHUB_TOKEN}@github.com/${repo}.git`
  const cmd = [
    'git clone',
    repoUrl,
    WORKING_DIR
  ].join(' ')

  core.info(`Cloning action from https://***TOKEN***@github.com/${repo}.git${sha ? ` (SHA: ${sha})` : ''}`)
  await exec.exec(cmd)

  core.info('Remove github token from config')
  await exec.exec(`git remote set-url origin https://github.com/${repo}.git`, null, { cwd: WORKING_DIR })

  if (sha) {
    core.info(`Checking out ${sha}`)
    await exec.exec(`git checkout ${sha}`, null, { cwd: WORKING_DIR })
  }

  core.info('Reading action.yml')
  const actionFile = readFileSync(`${WORKING_DIR}/action.yml`, 'utf8')
  const action = parse(actionFile)
  
  if (!(action && action.name && action.runs && action.runs.main)) {
    throw new Error('Malformed action.yml found')
  }

  core.endGroup('Cloning private action')
  
  core.startGroup('Input Setting')
  function getVals(label){
    const keys = Object.keys(process.env)
    .filter(key => key.startsWith('INPUT_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});

    console.log(label, JSON.stringify(keys, null, 2))
  }
  getVals('***BEFORE***')
  setInputs(action)
  getVals('***AFTER***')
  core.endGroup('Input Setting')

  core.info(`Starting private action ${action.name}`)
  core.startGroup(`${action.name}`)
  await exec.exec(`node ${join(WORKING_DIR, action.runs.main)}`)
  core.endGroup(`${action.name}`)
}

function parseRepo () {
  const repoArr = GITHUB_REPO.split('@')
  return {
    repo: repoArr[0],
    sha: repoArr[1]
  }
}

function setInputs(action){
  if (!action.inputs) {
    core.info('No inputs defined in action.');
    return;
  }

  core.info(`The configured inputs are ${Object.keys(action.inputs)}`)

  for (const i of Object.keys(action.inputs)) {
    const formattedInputName = `INPUT_${i.toUpperCase()}`;

    if ((process.env[formattedInputName])) {
      core.info(`Input ${i} already set`)
      // the input was provided
      break;
    } else if (!action.inputs[i].required && !action.inputs[i].default) {
      core.info(`Input ${i} not required and has no default`)
      break;
    } else if (action.inputs[i].required && !action.inputs[i].default) {
      // input not provided, is required, and no default set
      core.error(`Input ${i} required but not provided and no default is set`);
    }

    // input not provided so use the default
    core.info(`Input ${i} not set.  Using default '${action.inputs[i].default}'`)
    process.env[formattedInputName] = action.inputs[i].default
  }

}

run().then(() => {
  core.info('Action completed successfully')
}).catch((e) => {
  core.setFailed(e.toString())
})


/***/ }),

/***/ 684:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPair = findPair;
exports.default = void 0;

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findPair(items, key) {
  const k = key instanceof _Scalar.default ? key.value : key;

  for (const it of items) {
    if (it instanceof _Pair.default) {
      if (it.key === key || it.key === k) return it;
      if (it.key && it.key.value === k) return it;
    }
  }

  return undefined;
}

class YAMLMap extends _Collection.default {
  add(pair) {
    if (!pair) pair = new _Pair.default(pair);else if (!(pair instanceof _Pair.default)) pair = new _Pair.default(pair.key || pair, pair.value);
    const prev = findPair(this.items, pair.key);
    if (prev) throw new Error(`Key ${pair.key} already set`);
    this.items.push(pair);
  }

  delete(key) {
    const it = findPair(this.items, key);
    if (!it) return false;
    const del = this.items.splice(this.items.indexOf(it), 1);
    return del.length > 0;
  }

  get(key, keepScalar) {
    const it = findPair(this.items, key);
    const node = it && it.value;
    return !keepScalar && node instanceof _Scalar.default ? node.value : node;
  }

  has(key) {
    return !!findPair(this.items, key);
  }

  set(key, value) {
    const prev = findPair(this.items, key);
    if (prev) prev.value = value;else this.items.push(new _Pair.default(key, value));
  }
  /**
   * @param {*} arg ignored
   * @param {*} ctx Conversion context, originally set in Document#toJSON()
   * @param {Class} Type If set, forces the returned collection type
   * @returns {*} Instance of Type, Map, or Object
   */


  toJSON(_, ctx, Type) {
    const map = Type ? new Type() : ctx && ctx.mapAsMap ? new Map() : {};
    if (ctx && ctx.onCreate) ctx.onCreate(map);

    for (const item of this.items) item.addToJSMap(ctx, map);

    return map;
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this);

    for (const item of this.items) {
      if (!(item instanceof _Pair.default)) throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
    }

    return super.toString(ctx, {
      blockItem: n => n.str,
      flowChars: {
        start: '{',
        end: '}'
      },
      isMap: true,
      itemIndent: ctx.indent || ''
    }, onComment, onChompKeep);
  }

}

exports.default = YAMLMap;

/***/ }),

/***/ 725:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _errors = __webpack_require__(405);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class QuoteDouble extends _Node.default {
  static endOfQuote(src, offset) {
    let ch = src[offset];

    while (ch && ch !== '"') {
      offset += ch === '\\' ? 2 : 1;
      ch = src[offset];
    }

    return offset + 1;
  }
  /**
   * @returns {string | { str: string, errors: YAMLSyntaxError[] }}
   */


  get strValue() {
    if (!this.valueRange || !this.context) return null;
    const errors = [];
    const {
      start,
      end
    } = this.valueRange;
    const {
      indent,
      src
    } = this.context;
    if (src[end - 1] !== '"') errors.push(new _errors.YAMLSyntaxError(this, 'Missing closing "quote')); // Using String#replace is too painful with escaped newlines preceded by
    // escaped backslashes; also, this should be faster.

    let str = '';

    for (let i = start + 1; i < end - 1; ++i) {
      const ch = src[i];

      if (ch === '\n') {
        if (_Node.default.atDocumentBoundary(src, i + 1)) errors.push(new _errors.YAMLSemanticError(this, 'Document boundary indicators are not allowed within string values'));

        const {
          fold,
          offset,
          error
        } = _Node.default.foldNewline(src, i, indent);

        str += fold;
        i = offset;
        if (error) errors.push(new _errors.YAMLSemanticError(this, 'Multi-line double-quoted string needs to be sufficiently indented'));
      } else if (ch === '\\') {
        i += 1;

        switch (src[i]) {
          case '0':
            str += '\0';
            break;
          // null character

          case 'a':
            str += '\x07';
            break;
          // bell character

          case 'b':
            str += '\b';
            break;
          // backspace

          case 'e':
            str += '\x1b';
            break;
          // escape character

          case 'f':
            str += '\f';
            break;
          // form feed

          case 'n':
            str += '\n';
            break;
          // line feed

          case 'r':
            str += '\r';
            break;
          // carriage return

          case 't':
            str += '\t';
            break;
          // horizontal tab

          case 'v':
            str += '\v';
            break;
          // vertical tab

          case 'N':
            str += '\u0085';
            break;
          // Unicode next line

          case '_':
            str += '\u00a0';
            break;
          // Unicode non-breaking space

          case 'L':
            str += '\u2028';
            break;
          // Unicode line separator

          case 'P':
            str += '\u2029';
            break;
          // Unicode paragraph separator

          case ' ':
            str += ' ';
            break;

          case '"':
            str += '"';
            break;

          case '/':
            str += '/';
            break;

          case '\\':
            str += '\\';
            break;

          case '\t':
            str += '\t';
            break;

          case 'x':
            str += this.parseCharCode(i + 1, 2, errors);
            i += 2;
            break;

          case 'u':
            str += this.parseCharCode(i + 1, 4, errors);
            i += 4;
            break;

          case 'U':
            str += this.parseCharCode(i + 1, 8, errors);
            i += 8;
            break;

          case '\n':
            // skip escaped newlines, but still trim the following line
            while (src[i + 1] === ' ' || src[i + 1] === '\t') i += 1;

            break;

          default:
            errors.push(new _errors.YAMLSyntaxError(this, `Invalid escape sequence ${src.substr(i - 1, 2)}`));
            str += '\\' + src[i];
        }
      } else if (ch === ' ' || ch === '\t') {
        // trim trailing whitespace
        const wsStart = i;
        let next = src[i + 1];

        while (next === ' ' || next === '\t') {
          i += 1;
          next = src[i + 1];
        }

        if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch;
      } else {
        str += ch;
      }
    }

    return errors.length > 0 ? {
      errors,
      str
    } : str;
  }

  parseCharCode(offset, length, errors) {
    const {
      src
    } = this.context;
    const cc = src.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;

    if (isNaN(code)) {
      errors.push(new _errors.YAMLSyntaxError(this, `Invalid escape sequence ${src.substr(offset - 2, length + 2)}`));
      return src.substr(offset - 2, length + 2);
    }

    return String.fromCodePoint(code);
  }
  /**
   * Parses a "double quoted" value from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */


  parse(context, start) {
    this.context = context;
    const {
      src
    } = context;
    let offset = QuoteDouble.endOfQuote(src, start + 1);
    this.valueRange = new _Range.default(start, offset);
    offset = _Node.default.endOfWhiteSpace(src, offset);
    offset = this.parseComment(offset);
    return offset;
  }

}

exports.default = QuoteDouble;

/***/ }),

/***/ 732:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Map = _interopRequireDefault(__webpack_require__(684));

var _parseMap = _interopRequireDefault(__webpack_require__(763));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createMap(schema, obj, ctx) {
  const map = new _Map.default();

  if (obj instanceof Map) {
    for (const [key, value] of obj) map.items.push(schema.createPair(key, value, ctx));
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) map.items.push(schema.createPair(key, obj[key], ctx));
  }

  return map;
}

var _default = {
  createNode: createMap,
  default: true,
  nodeClass: _Map.default,
  tag: 'tag:yaml.org,2002:map',
  resolve: _parseMap.default
};
exports.default = _default;

/***/ }),

/***/ 734:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkFlowCollectionEnd = checkFlowCollectionEnd;
exports.checkKeyLength = checkKeyLength;
exports.resolveComments = resolveComments;

var _errors = __webpack_require__(405);

var _constants = __webpack_require__(49);

function checkFlowCollectionEnd(errors, cst) {
  let char, name;

  switch (cst.type) {
    case _constants.Type.FLOW_MAP:
      char = '}';
      name = 'flow map';
      break;

    case _constants.Type.FLOW_SEQ:
      char = ']';
      name = 'flow sequence';
      break;

    default:
      errors.push(new _errors.YAMLSemanticError(cst, 'Not a flow collection!?'));
      return;
  }

  let lastItem;

  for (let i = cst.items.length - 1; i >= 0; --i) {
    const item = cst.items[i];

    if (!item || item.type !== _constants.Type.COMMENT) {
      lastItem = item;
      break;
    }
  }

  if (lastItem && lastItem.char !== char) {
    const msg = `Expected ${name} to end with ${char}`;
    let err;

    if (typeof lastItem.offset === 'number') {
      err = new _errors.YAMLSemanticError(cst, msg);
      err.offset = lastItem.offset + 1;
    } else {
      err = new _errors.YAMLSemanticError(lastItem, msg);
      if (lastItem.range && lastItem.range.end) err.offset = lastItem.range.end - lastItem.range.start;
    }

    errors.push(err);
  }
}

function checkKeyLength(errors, node, itemIdx, key, keyStart) {
  if (!key || typeof keyStart !== 'number') return;
  const item = node.items[itemIdx];
  let keyEnd = item && item.range && item.range.start;

  if (!keyEnd) {
    for (let i = itemIdx - 1; i >= 0; --i) {
      const it = node.items[i];

      if (it && it.range) {
        keyEnd = it.range.end + 2 * (itemIdx - i);
        break;
      }
    }
  }

  if (keyEnd > keyStart + 1024) {
    const k = String(key).substr(0, 8) + '...' + String(key).substr(-8);
    errors.push(new _errors.YAMLSemanticError(node, `The "${k}" key is too long`));
  }
}

function resolveComments(collection, comments) {
  for (const {
    afterKey,
    before,
    comment
  } of comments) {
    let item = collection.items[before];

    if (!item) {
      if (comment !== undefined) {
        if (collection.comment) collection.comment += '\n' + comment;else collection.comment = comment;
      }
    } else {
      if (afterKey && item.value) item = item.value;

      if (comment === undefined) {
        if (afterKey || !item.commentBefore) item.spaceBefore = true;
      } else {
        if (item.commentBefore) item.commentBefore += '\n' + comment;else item.commentBefore = comment;
      }
    }
  }
}

/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 763:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseMap;

var _constants = __webpack_require__(49);

var _PlainValue = _interopRequireDefault(__webpack_require__(119));

var _errors = __webpack_require__(405);

var _Map = _interopRequireDefault(__webpack_require__(684));

var _Merge = _interopRequireWildcard(__webpack_require__(386));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _parseUtils = __webpack_require__(734);

var _Alias = _interopRequireDefault(__webpack_require__(637));

var _Collection = _interopRequireDefault(__webpack_require__(380));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseMap(doc, cst) {
  if (cst.type !== _constants.Type.MAP && cst.type !== _constants.Type.FLOW_MAP) {
    const msg = `A ${cst.type} node cannot be resolved as a mapping`;
    doc.errors.push(new _errors.YAMLSyntaxError(cst, msg));
    return null;
  }

  const {
    comments,
    items
  } = cst.type === _constants.Type.FLOW_MAP ? resolveFlowMapItems(doc, cst) : resolveBlockMapItems(doc, cst);
  const map = new _Map.default();
  map.items = items;
  (0, _parseUtils.resolveComments)(map, comments);
  let hasCollectionKey = false;

  for (let i = 0; i < items.length; ++i) {
    const {
      key: iKey
    } = items[i];
    if (iKey instanceof _Collection.default) hasCollectionKey = true;

    if (doc.schema.merge && iKey && iKey.value === _Merge.MERGE_KEY) {
      items[i] = new _Merge.default(items[i]);
      const sources = items[i].value.items;
      let error = null;
      sources.some(node => {
        if (node instanceof _Alias.default) {
          // During parsing, alias sources are CST nodes; to account for
          // circular references their resolved values can't be used here.
          const {
            type
          } = node.source;
          if (type === _constants.Type.MAP || type === _constants.Type.FLOW_MAP) return false;
          return error = 'Merge nodes aliases can only point to maps';
        }

        return error = 'Merge nodes can only have Alias nodes as values';
      });
      if (error) doc.errors.push(new _errors.YAMLSemanticError(cst, error));
    } else {
      for (let j = i + 1; j < items.length; ++j) {
        const {
          key: jKey
        } = items[j];

        if (iKey === jKey || iKey && jKey && Object.prototype.hasOwnProperty.call(iKey, 'value') && iKey.value === jKey.value) {
          const msg = `Map keys must be unique; "${iKey}" is repeated`;
          doc.errors.push(new _errors.YAMLSemanticError(cst, msg));
          break;
        }
      }
    }
  }

  if (hasCollectionKey && !doc.options.mapAsMap) {
    const warn = 'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.';
    doc.warnings.push(new _errors.YAMLWarning(cst, warn));
  }

  cst.resolved = map;
  return map;
}

const valueHasPairComment = ({
  context: {
    lineStart,
    node,
    src
  },
  props
}) => {
  if (props.length === 0) return false;
  const {
    start
  } = props[0];
  if (node && start > node.valueRange.start) return false;
  if (src[start] !== _constants.Char.COMMENT) return false;

  for (let i = lineStart; i < start; ++i) if (src[i] === '\n') return false;

  return true;
};

function resolvePairComment(item, pair) {
  if (!valueHasPairComment(item)) return;
  const comment = item.getPropValue(0, _constants.Char.COMMENT, true);
  let found = false;
  const cb = pair.value.commentBefore;

  if (cb && cb.startsWith(comment)) {
    pair.value.commentBefore = cb.substr(comment.length + 1);
    found = true;
  } else {
    const cc = pair.value.comment;

    if (!item.node && cc && cc.startsWith(comment)) {
      pair.value.comment = cc.substr(comment.length + 1);
      found = true;
    }
  }

  if (found) pair.comment = comment;
}

function resolveBlockMapItems(doc, cst) {
  const comments = [];
  const items = [];
  let key = undefined;
  let keyStart = null;

  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i];

    switch (item.type) {
      case _constants.Type.BLANK_LINE:
        comments.push({
          afterKey: !!key,
          before: items.length
        });
        break;

      case _constants.Type.COMMENT:
        comments.push({
          afterKey: !!key,
          before: items.length,
          comment: item.comment
        });
        break;

      case _constants.Type.MAP_KEY:
        if (key !== undefined) items.push(new _Pair.default(key));
        if (item.error) doc.errors.push(item.error);
        key = doc.resolveNode(item.node);
        keyStart = null;
        break;

      case _constants.Type.MAP_VALUE:
        {
          if (key === undefined) key = null;
          if (item.error) doc.errors.push(item.error);

          if (!item.context.atLineStart && item.node && item.node.type === _constants.Type.MAP && !item.node.context.atLineStart) {
            const msg = 'Nested mappings are not allowed in compact mappings';
            doc.errors.push(new _errors.YAMLSemanticError(item.node, msg));
          }

          let valueNode = item.node;

          if (!valueNode && item.props.length > 0) {
            // Comments on an empty mapping value need to be preserved, so we
            // need to construct a minimal empty node here to use instead of the
            // missing `item.node`. -- eemeli/yaml#19
            valueNode = new _PlainValue.default(_constants.Type.PLAIN, []);
            valueNode.context = {
              parent: item,
              src: item.context.src
            };
            const pos = item.range.start + 1;
            valueNode.range = {
              start: pos,
              end: pos
            };
            valueNode.valueRange = {
              start: pos,
              end: pos
            };

            if (typeof item.range.origStart === 'number') {
              const origPos = item.range.origStart + 1;
              valueNode.range.origStart = valueNode.range.origEnd = origPos;
              valueNode.valueRange.origStart = valueNode.valueRange.origEnd = origPos;
            }
          }

          const pair = new _Pair.default(key, doc.resolveNode(valueNode));
          resolvePairComment(item, pair);
          items.push(pair);
          (0, _parseUtils.checkKeyLength)(doc.errors, cst, i, key, keyStart);
          key = undefined;
          keyStart = null;
        }
        break;

      default:
        if (key !== undefined) items.push(new _Pair.default(key));
        key = doc.resolveNode(item);
        keyStart = item.range.start;
        if (item.error) doc.errors.push(item.error);

        next: for (let j = i + 1;; ++j) {
          const nextItem = cst.items[j];

          switch (nextItem && nextItem.type) {
            case _constants.Type.BLANK_LINE:
            case _constants.Type.COMMENT:
              continue next;

            case _constants.Type.MAP_VALUE:
              break next;

            default:
              doc.errors.push(new _errors.YAMLSemanticError(item, 'Implicit map keys need to be followed by map values'));
              break next;
          }
        }

        if (item.valueRangeContainsNewline) {
          const msg = 'Implicit map keys need to be on a single line';
          doc.errors.push(new _errors.YAMLSemanticError(item, msg));
        }

    }
  }

  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments,
    items
  };
}

function resolveFlowMapItems(doc, cst) {
  const comments = [];
  const items = [];
  let key = undefined;
  let keyStart = null;
  let explicitKey = false;
  let next = '{';

  for (let i = 0; i < cst.items.length; ++i) {
    (0, _parseUtils.checkKeyLength)(doc.errors, cst, i, key, keyStart);
    const item = cst.items[i];

    if (typeof item.char === 'string') {
      const {
        char,
        offset
      } = item;

      if (char === '?' && key === undefined && !explicitKey) {
        explicitKey = true;
        next = ':';
        continue;
      }

      if (char === ':') {
        if (key === undefined) key = null;

        if (next === ':') {
          next = ',';
          continue;
        }
      } else {
        if (explicitKey) {
          if (key === undefined && char !== ',') key = null;
          explicitKey = false;
        }

        if (key !== undefined) {
          items.push(new _Pair.default(key));
          key = undefined;
          keyStart = null;

          if (char === ',') {
            next = ':';
            continue;
          }
        }
      }

      if (char === '}') {
        if (i === cst.items.length - 1) continue;
      } else if (char === next) {
        next = ':';
        continue;
      }

      const msg = `Flow map contains an unexpected ${char}`;
      const err = new _errors.YAMLSyntaxError(cst, msg);
      err.offset = offset;
      doc.errors.push(err);
    } else if (item.type === _constants.Type.BLANK_LINE) {
      comments.push({
        afterKey: !!key,
        before: items.length
      });
    } else if (item.type === _constants.Type.COMMENT) {
      comments.push({
        afterKey: !!key,
        before: items.length,
        comment: item.comment
      });
    } else if (key === undefined) {
      if (next === ',') doc.errors.push(new _errors.YAMLSemanticError(item, 'Separator , missing in flow map'));
      key = doc.resolveNode(item);
      keyStart = explicitKey ? null : item.range.start; // TODO: add error for non-explicit multiline plain key
    } else {
      if (next !== ',') doc.errors.push(new _errors.YAMLSemanticError(item, 'Indicator : missing in flow map entry'));
      items.push(new _Pair.default(key, doc.resolveNode(item)));
      key = undefined;
      explicitKey = false;
    }
  }

  (0, _parseUtils.checkFlowCollectionEnd)(doc.errors, cst);
  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments,
    items
  };
}

/***/ }),

/***/ 767:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parseSeq = _interopRequireDefault(__webpack_require__(858));

var _Seq = _interopRequireDefault(__webpack_require__(29));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createSeq(schema, obj, ctx) {
  const seq = new _Seq.default();

  if (obj && obj[Symbol.iterator]) {
    for (const it of obj) {
      const v = schema.createNode(it, ctx.wrapScalars, null, ctx);
      seq.items.push(v);
    }
  }

  return seq;
}

var _default = {
  createNode: createSeq,
  default: true,
  nodeClass: _Seq.default,
  tag: 'tag:yaml.org,2002:seq',
  resolve: _parseSeq.default
};
exports.default = _default;

/***/ }),

/***/ 775:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _stringify = __webpack_require__(454);

var _failsafe = _interopRequireDefault(__webpack_require__(195));

var _options = __webpack_require__(422);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _failsafe.default.concat([{
  identify: value => value == null,
  createNode: (schema, value, ctx) => ctx.wrapScalars ? new _Scalar.default(null) : null,
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => null,
  options: _options.nullOptions,
  stringify: () => _options.nullOptions.nullStr
}, {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: str => str[0] === 't' || str[0] === 'T',
  options: _options.boolOptions,
  stringify: ({
    value
  }) => value ? _options.boolOptions.trueStr : _options.boolOptions.falseStr
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^0o([0-7]+)$/,
  resolve: (str, oct) => parseInt(oct, 8),
  stringify: ({
    value
  }) => '0o' + value.toString(8)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: str => parseInt(str, 10),
  stringify: _stringify.stringifyNumber
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x([0-9a-fA-F]+)$/,
  resolve: (str, hex) => parseInt(hex, 16),
  stringify: ({
    value
  }) => '0x' + value.toString(16)
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: (str, nan) => nan ? NaN : str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: _stringify.stringifyNumber
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'EXP',
  test: /^[-+]?(?:0|[1-9][0-9]*)(\.[0-9]*)?[eE][-+]?[0-9]+$/,
  resolve: str => parseFloat(str),
  stringify: ({
    value
  }) => Number(value).toExponential()
}, {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(?:0|[1-9][0-9]*)\.([0-9]*)$/,

  resolve(str, frac) {
    const node = new _Scalar.default(parseFloat(str));
    if (frac && frac[frac.length - 1] === '0') node.minFractionDigits = frac.length;
    return node;
  },

  stringify: _stringify.stringifyNumber
}]);

exports.default = _default;

/***/ }),

/***/ 785:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.YAMLSet = void 0;

var _errors = __webpack_require__(405);

var _Map = _interopRequireWildcard(__webpack_require__(684));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _parseMap = _interopRequireDefault(__webpack_require__(763));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class YAMLSet extends _Map.default {
  constructor() {
    super();
    this.tag = YAMLSet.tag;
  }

  add(key) {
    const pair = key instanceof _Pair.default ? key : new _Pair.default(key);
    const prev = (0, _Map.findPair)(this.items, pair.key);
    if (!prev) this.items.push(pair);
  }

  get(key, keepPair) {
    const pair = (0, _Map.findPair)(this.items, key);
    return !keepPair && pair instanceof _Pair.default ? pair.key instanceof _Scalar.default ? pair.key.value : pair.key : pair;
  }

  set(key, value) {
    if (typeof value !== 'boolean') throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
    const prev = (0, _Map.findPair)(this.items, key);

    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1);
    } else if (!prev && value) {
      this.items.push(new _Pair.default(key));
    }
  }

  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set);
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this);
    if (this.hasAllNullValues()) return super.toString(ctx, onComment, onChompKeep);else throw new Error('Set items must all have null values');
  }

}

exports.YAMLSet = YAMLSet;

_defineProperty(YAMLSet, "tag", 'tag:yaml.org,2002:set');

function parseSet(doc, cst) {
  const map = (0, _parseMap.default)(doc, cst);
  if (!map.hasAllNullValues()) throw new _errors.YAMLSemanticError(cst, 'Set items must all have null values');
  return Object.assign(new YAMLSet(), map);
}

function createSet(schema, iterable, ctx) {
  const set = new YAMLSet();

  for (const value of iterable) set.items.push(schema.createPair(value, null, ctx));

  return set;
}

var _default = {
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',
  resolve: parseSet,
  createNode: createSet
};
exports.default = _default;

/***/ }),

/***/ 792:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _parse = _interopRequireDefault(__webpack_require__(309));

var _Document = _interopRequireDefault(__webpack_require__(570));

var _errors = __webpack_require__(405);

var _schema = _interopRequireDefault(__webpack_require__(255));

var _warnings = __webpack_require__(847);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultOptions = {
  anchorPrefix: 'a',
  customTags: null,
  keepCstNodes: false,
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  mapAsMap: false,
  maxAliasCount: 100,
  prettyErrors: false,
  // TODO Set true in v2
  simpleKeys: false,
  version: '1.2'
};

function createNode(value, wrapScalars = true, tag) {
  if (tag === undefined && typeof wrapScalars === 'string') {
    tag = wrapScalars;
    wrapScalars = true;
  }

  const options = Object.assign({}, _Document.default.defaults[defaultOptions.version], defaultOptions);
  const schema = new _schema.default(options);
  return schema.createNode(value, wrapScalars, tag);
}

class Document extends _Document.default {
  constructor(options) {
    super(Object.assign({}, defaultOptions, options));
  }

}

function parseAllDocuments(src, options) {
  const stream = [];
  let prev;

  for (const cstDoc of (0, _parse.default)(src)) {
    const doc = new Document(options);
    doc.parse(cstDoc, prev);
    stream.push(doc);
    prev = doc;
  }

  return stream;
}

function parseDocument(src, options) {
  const cst = (0, _parse.default)(src);
  const doc = new Document(options).parse(cst[0]);

  if (cst.length > 1) {
    const errMsg = 'Source contains multiple documents; please use YAML.parseAllDocuments()';
    doc.errors.unshift(new _errors.YAMLSemanticError(cst[1], errMsg));
  }

  return doc;
}

function parse(src, options) {
  const doc = parseDocument(src, options);
  doc.warnings.forEach(warning => (0, _warnings.warn)(warning));
  if (doc.errors.length > 0) throw doc.errors[0];
  return doc.toJSON();
}

function stringify(value, options) {
  const doc = new Document(options);
  doc.contents = value;
  return String(doc);
}

var _default = {
  createNode,
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST: _parse.default,
  parseDocument,
  stringify
};
exports.default = _default;

/***/ }),

/***/ 794:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class BlankLine extends _Node.default {
  constructor() {
    super(_constants.Type.BLANK_LINE);
  }

  get includesTrailingLines() {
    return true;
  }
  /**
   * Parses blank lines from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first \n character
   * @returns {number} - Index of the character after this
   */


  parse(context, start) {
    this.context = context;
    const {
      src
    } = context;
    let offset = start + 1;

    while (_Node.default.atBlank(src, offset)) {
      const lineEnd = _Node.default.endOfWhiteSpace(src, offset);

      if (lineEnd === '\n') offset = lineEnd + 1;else break;
    }

    this.range = new _Range.default(start, offset);
    return offset;
  }

}

exports.default = BlankLine;

/***/ }),

/***/ 821:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.YAMLOMap = void 0;

var _errors = __webpack_require__(405);

var _toJSON = _interopRequireDefault(__webpack_require__(923));

var _Map = _interopRequireDefault(__webpack_require__(684));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

var _Seq = _interopRequireDefault(__webpack_require__(29));

var _pairs = __webpack_require__(566);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class YAMLOMap extends _Seq.default {
  constructor() {
    super();

    _defineProperty(this, "add", _Map.default.prototype.add.bind(this));

    _defineProperty(this, "delete", _Map.default.prototype.delete.bind(this));

    _defineProperty(this, "get", _Map.default.prototype.get.bind(this));

    _defineProperty(this, "has", _Map.default.prototype.has.bind(this));

    _defineProperty(this, "set", _Map.default.prototype.set.bind(this));

    this.tag = YAMLOMap.tag;
  }

  toJSON(_, ctx) {
    const map = new Map();
    if (ctx && ctx.onCreate) ctx.onCreate(map);

    for (const pair of this.items) {
      let key, value;

      if (pair instanceof _Pair.default) {
        key = (0, _toJSON.default)(pair.key, '', ctx);
        value = (0, _toJSON.default)(pair.value, key, ctx);
      } else {
        key = (0, _toJSON.default)(pair, '', ctx);
      }

      if (map.has(key)) throw new Error('Ordered maps must not include duplicate keys');
      map.set(key, value);
    }

    return map;
  }

}

exports.YAMLOMap = YAMLOMap;

_defineProperty(YAMLOMap, "tag", 'tag:yaml.org,2002:omap');

function parseOMap(doc, cst) {
  const pairs = (0, _pairs.parsePairs)(doc, cst);
  const seenKeys = [];

  for (const {
    key
  } of pairs.items) {
    if (key instanceof _Scalar.default) {
      if (seenKeys.includes(key.value)) {
        const msg = 'Ordered maps must not include duplicate keys';
        throw new _errors.YAMLSemanticError(cst, msg);
      } else {
        seenKeys.push(key.value);
      }
    }
  }

  return Object.assign(new YAMLOMap(), pairs);
}

function createOMap(schema, iterable, ctx) {
  const pairs = (0, _pairs.createPairs)(schema, iterable, ctx);
  const omap = new YAMLOMap();
  omap.items = pairs.items;
  return omap;
}

var _default = {
  identify: value => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: 'tag:yaml.org,2002:omap',
  resolve: parseOMap,
  createNode: createOMap
};
exports.default = _default;

/***/ }),

/***/ 836:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addCommentBefore = addCommentBefore;
exports.default = addComment;

function addCommentBefore(str, indent, comment) {
  if (!comment) return str;
  const cc = comment.replace(/[\s\S]^/gm, `$&${indent}#`);
  return `#${cc}\n${indent}${str}`;
}

function addComment(str, indent, comment) {
  return !comment ? str : comment.indexOf('\n') === -1 ? `${str} #${comment}` : `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`);
}

/***/ }),

/***/ 847:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.warn = warn;
exports.warnFileDeprecation = warnFileDeprecation;
exports.warnOptionDeprecation = warnOptionDeprecation;

/* global global, console */
function warn(warning, type) {
  if (global && global._YAML_SILENCE_WARNINGS) return;
  const {
    emitWarning
  } = global && global.process; // This will throw in Jest if `warning` is an Error instance due to
  // https://github.com/facebook/jest/issues/2549

  if (emitWarning) emitWarning(warning, type);else {
    // eslint-disable-next-line no-console
    console.warn(type ? `${type}: ${warning}` : warning);
  }
}

function warnFileDeprecation(filename) {
  if (global && global._YAML_SILENCE_DEPRECATION_WARNINGS) return;
  const path = filename.replace(/.*yaml[/\\]/i, '').replace(/\.js$/, '').replace(/\\/g, '/');
  warn(`The endpoint 'yaml/${path}' will be removed in a future release.`, 'DeprecationWarning');
}

const warned = {};

function warnOptionDeprecation(name, alternative) {
  if (global && global._YAML_SILENCE_DEPRECATION_WARNINGS) return;
  if (warned[name]) return;
  warned[name] = true;
  let msg = `The option '${name}' will be removed in a future release`;
  msg += alternative ? `, use '${alternative}' instead.` : '.';
  warn(msg, 'DeprecationWarning');
}

/***/ }),

/***/ 856:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Alias extends _Node.default {
  /**
   * Parses an *alias from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse(context, start) {
    this.context = context;
    const {
      src
    } = context;

    let offset = _Node.default.endOfIdentifier(src, start + 1);

    this.valueRange = new _Range.default(start + 1, offset);
    offset = _Node.default.endOfWhiteSpace(src, offset);
    offset = this.parseComment(offset);
    return offset;
  }

}

exports.default = Alias;

/***/ }),

/***/ 858:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseSeq;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _parseUtils = __webpack_require__(734);

var _Seq = _interopRequireDefault(__webpack_require__(29));

var _Collection = _interopRequireDefault(__webpack_require__(380));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseSeq(doc, cst) {
  if (cst.type !== _constants.Type.SEQ && cst.type !== _constants.Type.FLOW_SEQ) {
    const msg = `A ${cst.type} node cannot be resolved as a sequence`;
    doc.errors.push(new _errors.YAMLSyntaxError(cst, msg));
    return null;
  }

  const {
    comments,
    items
  } = cst.type === _constants.Type.FLOW_SEQ ? resolveFlowSeqItems(doc, cst) : resolveBlockSeqItems(doc, cst);
  const seq = new _Seq.default();
  seq.items = items;
  (0, _parseUtils.resolveComments)(seq, comments);

  if (!doc.options.mapAsMap && items.some(it => it instanceof _Pair.default && it.key instanceof _Collection.default)) {
    const warn = 'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.';
    doc.warnings.push(new _errors.YAMLWarning(cst, warn));
  }

  cst.resolved = seq;
  return seq;
}

function resolveBlockSeqItems(doc, cst) {
  const comments = [];
  const items = [];

  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i];

    switch (item.type) {
      case _constants.Type.BLANK_LINE:
        comments.push({
          before: items.length
        });
        break;

      case _constants.Type.COMMENT:
        comments.push({
          comment: item.comment,
          before: items.length
        });
        break;

      case _constants.Type.SEQ_ITEM:
        if (item.error) doc.errors.push(item.error);
        items.push(doc.resolveNode(item.node));

        if (item.hasProps) {
          const msg = 'Sequence items cannot have tags or anchors before the - indicator';
          doc.errors.push(new _errors.YAMLSemanticError(item, msg));
        }

        break;

      default:
        if (item.error) doc.errors.push(item.error);
        doc.errors.push(new _errors.YAMLSyntaxError(item, `Unexpected ${item.type} node in sequence`));
    }
  }

  return {
    comments,
    items
  };
}

function resolveFlowSeqItems(doc, cst) {
  const comments = [];
  const items = [];
  let explicitKey = false;
  let key = undefined;
  let keyStart = null;
  let next = '[';

  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i];

    if (typeof item.char === 'string') {
      const {
        char,
        offset
      } = item;

      if (char !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = next ? items.pop() : null;
        items.push(new _Pair.default(key));
        explicitKey = false;
        key = undefined;
        keyStart = null;
      }

      if (char === next) {
        next = null;
      } else if (!next && char === '?') {
        explicitKey = true;
      } else if (next !== '[' && char === ':' && key === undefined) {
        if (next === ',') {
          key = items.pop();

          if (key instanceof _Pair.default) {
            const msg = 'Chaining flow sequence pairs is invalid';
            const err = new _errors.YAMLSemanticError(cst, msg);
            err.offset = offset;
            doc.errors.push(err);
          }

          if (!explicitKey) (0, _parseUtils.checkKeyLength)(doc.errors, cst, i, key, keyStart);
        } else {
          key = null;
        }

        keyStart = null;
        explicitKey = false; // TODO: add error for non-explicit multiline plain key

        next = null;
      } else if (next === '[' || char !== ']' || i < cst.items.length - 1) {
        const msg = `Flow sequence contains an unexpected ${char}`;
        const err = new _errors.YAMLSyntaxError(cst, msg);
        err.offset = offset;
        doc.errors.push(err);
      }
    } else if (item.type === _constants.Type.BLANK_LINE) {
      comments.push({
        before: items.length
      });
    } else if (item.type === _constants.Type.COMMENT) {
      comments.push({
        comment: item.comment,
        before: items.length
      });
    } else {
      if (next) {
        const msg = `Expected a ${next} in flow sequence`;
        doc.errors.push(new _errors.YAMLSemanticError(item, msg));
      }

      const value = doc.resolveNode(item);

      if (key === undefined) {
        items.push(value);
      } else {
        items.push(new _Pair.default(key, value));
        key = undefined;
      }

      keyStart = item.range.start;
      next = ',';
    }
  }

  (0, _parseUtils.checkFlowCollectionEnd)(doc.errors, cst);
  if (key !== undefined) items.push(new _Pair.default(key));
  return {
    comments,
    items
  };
}

/***/ }),

/***/ 880:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Collection = _interopRequireDefault(__webpack_require__(380));

var _Pair = _interopRequireDefault(__webpack_require__(325));

var _Scalar = _interopRequireDefault(__webpack_require__(515));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const visit = (node, tags) => {
  if (node && typeof node === 'object') {
    const {
      tag
    } = node;

    if (node instanceof _Collection.default) {
      if (tag) tags[tag] = true;
      node.items.forEach(n => visit(n, tags));
    } else if (node instanceof _Pair.default) {
      visit(node.key, tags);
      visit(node.value, tags);
    } else if (node instanceof _Scalar.default) {
      if (tag) tags[tag] = true;
    }
  }

  return tags;
};

var _default = node => Object.keys(visit(node, {}));

exports.default = _default;

/***/ }),

/***/ 906:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _BlankLine = _interopRequireDefault(__webpack_require__(794));

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CollectionItem extends _Node.default {
  constructor(type, props) {
    super(type, props);
    this.node = null;
  }

  get includesTrailingLines() {
    return !!this.node && this.node.includesTrailingLines;
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  parse(context, start) {
    this.context = context;
    const {
      parseNode,
      src
    } = context;
    let {
      atLineStart,
      lineStart
    } = context;
    if (!atLineStart && this.type === _constants.Type.SEQ_ITEM) this.error = new _errors.YAMLSemanticError(this, 'Sequence items must not have preceding content on the same line');
    const indent = atLineStart ? start - lineStart : context.indent;

    let offset = _Node.default.endOfWhiteSpace(src, start + 1);

    let ch = src[offset];
    const inlineComment = ch === '#';
    const comments = [];
    let blankLine = null;

    while (ch === '\n' || ch === '#') {
      if (ch === '#') {
        const end = _Node.default.endOfLine(src, offset + 1);

        comments.push(new _Range.default(offset, end));
        offset = end;
      } else {
        atLineStart = true;
        lineStart = offset + 1;

        const wsEnd = _Node.default.endOfWhiteSpace(src, lineStart);

        if (src[wsEnd] === '\n' && comments.length === 0) {
          blankLine = new _BlankLine.default();
          lineStart = blankLine.parse({
            src
          }, lineStart);
        }

        offset = _Node.default.endOfIndent(src, lineStart);
      }

      ch = src[offset];
    }

    if (_Node.default.nextNodeIsIndented(ch, offset - (lineStart + indent), this.type !== _constants.Type.SEQ_ITEM)) {
      this.node = parseNode({
        atLineStart,
        inCollection: false,
        indent,
        lineStart,
        parent: this
      }, offset);
    } else if (ch && lineStart > start + 1) {
      offset = lineStart - 1;
    }

    if (this.node) {
      if (blankLine) {
        // Only blank lines preceding non-empty nodes are captured. Note that
        // this means that collection item range start indices do not always
        // increase monotonically. -- eemeli/yaml#126
        const items = context.parent.items || context.parent.contents;
        if (items) items.push(blankLine);
      }

      if (comments.length) Array.prototype.push.apply(this.props, comments);
      offset = this.node.range.end;
    } else {
      if (inlineComment) {
        const c = comments[0];
        this.props.push(c);
        offset = c.end;
      } else {
        offset = _Node.default.endOfLine(src, start + 1);
      }
    }

    const end = this.node ? this.node.valueRange.end : offset;
    this.valueRange = new _Range.default(start, end);
    return offset;
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset);
    return this.node ? this.node.setOrigRanges(cr, offset) : offset;
  }

  toString() {
    const {
      context: {
        src
      },
      node,
      range,
      value
    } = this;
    if (value != null) return value;
    const str = node ? src.slice(range.start, node.range.start) + String(node) : src.slice(range.start, range.end);
    return _Node.default.addStringTerminator(src, range.end, str);
  }

}

exports.default = CollectionItem;

/***/ }),

/***/ 923:
/***/ (function(__unusedmodule, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toJSON;

function toJSON(value, arg, ctx) {
  if (Array.isArray(value)) return value.map((v, i) => toJSON(v, String(i), ctx));

  if (value && typeof value.toJSON === 'function') {
    const anchor = ctx && ctx.anchors && ctx.anchors.find(a => a.node === value);
    if (anchor) ctx.onCreate = res => {
      anchor.res = res;
      delete ctx.onCreate;
    };
    const res = value.toJSON(arg, ctx);
    if (anchor && ctx.onCreate) ctx.onCreate(res);
    return res;
  }

  return value;
}

/***/ }),

/***/ 928:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _BlankLine = _interopRequireDefault(__webpack_require__(794));

var _Collection = __webpack_require__(954);

var _Comment = _interopRequireDefault(__webpack_require__(487));

var _Directive = _interopRequireDefault(__webpack_require__(641));

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Document extends _Node.default {
  static startCommentOrEndBlankLine(src, start) {
    const offset = _Node.default.endOfWhiteSpace(src, start);

    const ch = src[offset];
    return ch === '#' || ch === '\n' ? offset : start;
  }

  constructor() {
    super(_constants.Type.DOCUMENT);
    this.directives = null;
    this.contents = null;
    this.directivesEndMarker = null;
    this.documentEndMarker = null;
  }

  parseDirectives(start) {
    const {
      src
    } = this.context;
    this.directives = [];
    let atLineStart = true;
    let hasDirectives = false;
    let offset = start;

    while (!_Node.default.atDocumentBoundary(src, offset, _constants.Char.DIRECTIVES_END)) {
      offset = Document.startCommentOrEndBlankLine(src, offset);

      switch (src[offset]) {
        case '\n':
          if (atLineStart) {
            const blankLine = new _BlankLine.default();
            offset = blankLine.parse({
              src
            }, offset);

            if (offset < src.length) {
              this.directives.push(blankLine);
            }
          } else {
            offset += 1;
            atLineStart = true;
          }

          break;

        case '#':
          {
            const comment = new _Comment.default();
            offset = comment.parse({
              src
            }, offset);
            this.directives.push(comment);
            atLineStart = false;
          }
          break;

        case '%':
          {
            const directive = new _Directive.default();
            offset = directive.parse({
              parent: this,
              src
            }, offset);
            this.directives.push(directive);
            hasDirectives = true;
            atLineStart = false;
          }
          break;

        default:
          if (hasDirectives) {
            this.error = new _errors.YAMLSemanticError(this, 'Missing directives-end indicator line');
          } else if (this.directives.length > 0) {
            this.contents = this.directives;
            this.directives = [];
          }

          return offset;
      }
    }

    if (src[offset]) {
      this.directivesEndMarker = new _Range.default(offset, offset + 3);
      return offset + 3;
    }

    if (hasDirectives) {
      this.error = new _errors.YAMLSemanticError(this, 'Missing directives-end indicator line');
    } else if (this.directives.length > 0) {
      this.contents = this.directives;
      this.directives = [];
    }

    return offset;
  }

  parseContents(start) {
    const {
      parseNode,
      src
    } = this.context;
    if (!this.contents) this.contents = [];
    let lineStart = start;

    while (src[lineStart - 1] === '-') lineStart -= 1;

    let offset = _Node.default.endOfWhiteSpace(src, start);

    let atLineStart = lineStart === start;
    this.valueRange = new _Range.default(offset);

    while (!_Node.default.atDocumentBoundary(src, offset, _constants.Char.DOCUMENT_END)) {
      switch (src[offset]) {
        case '\n':
          if (atLineStart) {
            const blankLine = new _BlankLine.default();
            offset = blankLine.parse({
              src
            }, offset);

            if (offset < src.length) {
              this.contents.push(blankLine);
            }
          } else {
            offset += 1;
            atLineStart = true;
          }

          lineStart = offset;
          break;

        case '#':
          {
            const comment = new _Comment.default();
            offset = comment.parse({
              src
            }, offset);
            this.contents.push(comment);
            atLineStart = false;
          }
          break;

        default:
          {
            const iEnd = _Node.default.endOfIndent(src, offset);

            const context = {
              atLineStart,
              indent: -1,
              inFlow: false,
              inCollection: false,
              lineStart,
              parent: this
            };
            const node = parseNode(context, iEnd);
            if (!node) return this.valueRange.end = iEnd; // at next document start

            this.contents.push(node);
            offset = node.range.end;
            atLineStart = false;
            const ec = (0, _Collection.grabCollectionEndComments)(node);
            if (ec) Array.prototype.push.apply(this.contents, ec);
          }
      }

      offset = Document.startCommentOrEndBlankLine(src, offset);
    }

    this.valueRange.end = offset;

    if (src[offset]) {
      this.documentEndMarker = new _Range.default(offset, offset + 3);
      offset += 3;

      if (src[offset]) {
        offset = _Node.default.endOfWhiteSpace(src, offset);

        if (src[offset] === '#') {
          const comment = new _Comment.default();
          offset = comment.parse({
            src
          }, offset);
          this.contents.push(comment);
        }

        switch (src[offset]) {
          case '\n':
            offset += 1;
            break;

          case undefined:
            break;

          default:
            this.error = new _errors.YAMLSyntaxError(this, 'Document end marker line cannot have a non-comment suffix');
        }
      }
    }

    return offset;
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  parse(context, start) {
    context.root = this;
    this.context = context;
    const {
      src
    } = context;
    let offset = src.charCodeAt(start) === 0xfeff ? start + 1 : start; // skip BOM

    offset = this.parseDirectives(offset);
    offset = this.parseContents(offset);
    return offset;
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset);
    this.directives.forEach(node => {
      offset = node.setOrigRanges(cr, offset);
    });
    if (this.directivesEndMarker) offset = this.directivesEndMarker.setOrigRange(cr, offset);
    this.contents.forEach(node => {
      offset = node.setOrigRanges(cr, offset);
    });
    if (this.documentEndMarker) offset = this.documentEndMarker.setOrigRange(cr, offset);
    return offset;
  }

  toString() {
    const {
      contents,
      directives,
      value
    } = this;
    if (value != null) return value;
    let str = directives.join('');

    if (contents.length > 0) {
      if (directives.length > 0 || contents[0].type === _constants.Type.COMMENT) str += '---\n';
      str += contents.join('');
    }

    if (str[str.length - 1] !== '\n') str += '\n';
    return str;
  }

}

exports.default = Document;

/***/ }),

/***/ 954:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.grabCollectionEndComments = grabCollectionEndComments;
exports.default = void 0;

var _constants = __webpack_require__(49);

var _BlankLine = _interopRequireDefault(__webpack_require__(794));

var _CollectionItem = _interopRequireDefault(__webpack_require__(906));

var _Comment = _interopRequireDefault(__webpack_require__(487));

var _Node = _interopRequireDefault(__webpack_require__(974));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function grabCollectionEndComments(node) {
  let cnode = node;

  while (cnode instanceof _CollectionItem.default) cnode = cnode.node;

  if (!(cnode instanceof Collection)) return null;
  const len = cnode.items.length;
  let ci = -1;

  for (let i = len - 1; i >= 0; --i) {
    const n = cnode.items[i];

    if (n.type === _constants.Type.COMMENT) {
      // Keep sufficiently indented comments with preceding node
      const {
        indent,
        lineStart
      } = n.context;
      if (indent > 0 && n.range.start >= lineStart + indent) break;
      ci = i;
    } else if (n.type === _constants.Type.BLANK_LINE) ci = i;else break;
  }

  if (ci === -1) return null;
  const ca = cnode.items.splice(ci, len - ci);
  const prevEnd = ca[0].range.start;

  while (true) {
    cnode.range.end = prevEnd;
    if (cnode.valueRange && cnode.valueRange.end > prevEnd) cnode.valueRange.end = prevEnd;
    if (cnode === node) break;
    cnode = cnode.context.parent;
  }

  return ca;
}

class Collection extends _Node.default {
  static nextContentHasIndent(src, offset, indent) {
    const lineStart = _Node.default.endOfLine(src, offset) + 1;
    offset = _Node.default.endOfWhiteSpace(src, lineStart);
    const ch = src[offset];
    if (!ch) return false;
    if (offset >= lineStart + indent) return true;
    if (ch !== '#' && ch !== '\n') return false;
    return Collection.nextContentHasIndent(src, offset, indent);
  }

  constructor(firstItem) {
    super(firstItem.type === _constants.Type.SEQ_ITEM ? _constants.Type.SEQ : _constants.Type.MAP);

    for (let i = firstItem.props.length - 1; i >= 0; --i) {
      if (firstItem.props[i].start < firstItem.context.lineStart) {
        // props on previous line are assumed by the collection
        this.props = firstItem.props.slice(0, i + 1);
        firstItem.props = firstItem.props.slice(i + 1);
        const itemRange = firstItem.props[0] || firstItem.valueRange;
        firstItem.range.start = itemRange.start;
        break;
      }
    }

    this.items = [firstItem];
    const ec = grabCollectionEndComments(firstItem);
    if (ec) Array.prototype.push.apply(this.items, ec);
  }

  get includesTrailingLines() {
    return this.items.length > 0;
  }
  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */


  parse(context, start) {
    this.context = context;
    const {
      parseNode,
      src
    } = context; // It's easier to recalculate lineStart here rather than tracking down the
    // last context from which to read it -- eemeli/yaml#2

    let lineStart = _Node.default.startOfLine(src, start);

    const firstItem = this.items[0]; // First-item context needs to be correct for later comment handling
    // -- eemeli/yaml#17

    firstItem.context.parent = this;
    this.valueRange = _Range.default.copy(firstItem.valueRange);
    const indent = firstItem.range.start - firstItem.context.lineStart;
    let offset = start;
    offset = _Node.default.normalizeOffset(src, offset);
    let ch = src[offset];
    let atLineStart = _Node.default.endOfWhiteSpace(src, lineStart) === offset;
    let prevIncludesTrailingLines = false;

    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (atLineStart && ch === '\n' && !prevIncludesTrailingLines) {
          const blankLine = new _BlankLine.default();
          offset = blankLine.parse({
            src
          }, offset);
          this.valueRange.end = offset;

          if (offset >= src.length) {
            ch = null;
            break;
          }

          this.items.push(blankLine);
          offset -= 1; // blankLine.parse() consumes terminal newline
        } else if (ch === '#') {
          if (offset < lineStart + indent && !Collection.nextContentHasIndent(src, offset, indent)) {
            return offset;
          }

          const comment = new _Comment.default();
          offset = comment.parse({
            indent,
            lineStart,
            src
          }, offset);
          this.items.push(comment);
          this.valueRange.end = offset;

          if (offset >= src.length) {
            ch = null;
            break;
          }
        }

        lineStart = offset + 1;
        offset = _Node.default.endOfIndent(src, lineStart);

        if (_Node.default.atBlank(src, offset)) {
          const wsEnd = _Node.default.endOfWhiteSpace(src, offset);

          const next = src[wsEnd];

          if (!next || next === '\n' || next === '#') {
            offset = wsEnd;
          }
        }

        ch = src[offset];
        atLineStart = true;
      }

      if (!ch) {
        break;
      }

      if (offset !== lineStart + indent && (atLineStart || ch !== ':')) {
        if (lineStart > start) offset = lineStart;
        break;
      }

      if (firstItem.type === _constants.Type.SEQ_ITEM !== (ch === '-')) {
        let typeswitch = true;

        if (ch === '-') {
          // map key may start with -, as long as it's followed by a non-whitespace char
          const next = src[offset + 1];
          typeswitch = !next || next === '\n' || next === '\t' || next === ' ';
        }

        if (typeswitch) {
          if (lineStart > start) offset = lineStart;
          break;
        }
      }

      const node = parseNode({
        atLineStart,
        inCollection: true,
        indent,
        lineStart,
        parent: this
      }, offset);
      if (!node) return offset; // at next document start

      this.items.push(node);
      this.valueRange.end = node.valueRange.end;
      offset = _Node.default.normalizeOffset(src, node.range.end);
      ch = src[offset];
      atLineStart = false;
      prevIncludesTrailingLines = node.includesTrailingLines; // Need to reset lineStart and atLineStart here if preceding node's range
      // has advanced to check the current line's indentation level
      // -- eemeli/yaml#10 & eemeli/yaml#38

      if (ch) {
        let ls = offset - 1;
        let prev = src[ls];

        while (prev === ' ' || prev === '\t') prev = src[--ls];

        if (prev === '\n') {
          lineStart = ls + 1;
          atLineStart = true;
        }
      }

      const ec = grabCollectionEndComments(node);
      if (ec) Array.prototype.push.apply(this.items, ec);
    }

    return offset;
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset);
    this.items.forEach(node => {
      offset = node.setOrigRanges(cr, offset);
    });
    return offset;
  }

  toString() {
    const {
      context: {
        src
      },
      items,
      range,
      value
    } = this;
    if (value != null) return value;
    let str = src.slice(range.start, items[0].range.start) + String(items[0]);

    for (let i = 1; i < items.length; ++i) {
      const item = items[i];
      const {
        atLineStart,
        indent
      } = item.context;
      if (atLineStart) for (let i = 0; i < indent; ++i) str += ' ';
      str += String(item);
    }

    return _Node.default.addStringTerminator(src, range.end, str);
  }

}

exports.default = Collection;

/***/ }),

/***/ 968:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _Alias = _interopRequireDefault(__webpack_require__(856));

var _BlockValue = _interopRequireDefault(__webpack_require__(24));

var _Collection = _interopRequireDefault(__webpack_require__(954));

var _CollectionItem = _interopRequireDefault(__webpack_require__(906));

var _FlowCollection = _interopRequireDefault(__webpack_require__(185));

var _Node = _interopRequireDefault(__webpack_require__(974));

var _PlainValue = _interopRequireDefault(__webpack_require__(119));

var _QuoteDouble = _interopRequireDefault(__webpack_require__(725));

var _QuoteSingle = _interopRequireDefault(__webpack_require__(411));

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @param {boolean} atLineStart - Node starts at beginning of line
 * @param {boolean} inFlow - true if currently in a flow context
 * @param {boolean} inCollection - true if currently in a collection context
 * @param {number} indent - Current level of indentation
 * @param {number} lineStart - Start of the current line
 * @param {Node} parent - The parent of the node
 * @param {string} src - Source of the YAML document
 */
class ParseContext {
  static parseType(src, offset, inFlow) {
    switch (src[offset]) {
      case '*':
        return _constants.Type.ALIAS;

      case '>':
        return _constants.Type.BLOCK_FOLDED;

      case '|':
        return _constants.Type.BLOCK_LITERAL;

      case '{':
        return _constants.Type.FLOW_MAP;

      case '[':
        return _constants.Type.FLOW_SEQ;

      case '?':
        return !inFlow && _Node.default.atBlank(src, offset + 1, true) ? _constants.Type.MAP_KEY : _constants.Type.PLAIN;

      case ':':
        return !inFlow && _Node.default.atBlank(src, offset + 1, true) ? _constants.Type.MAP_VALUE : _constants.Type.PLAIN;

      case '-':
        return !inFlow && _Node.default.atBlank(src, offset + 1, true) ? _constants.Type.SEQ_ITEM : _constants.Type.PLAIN;

      case '"':
        return _constants.Type.QUOTE_DOUBLE;

      case "'":
        return _constants.Type.QUOTE_SINGLE;

      default:
        return _constants.Type.PLAIN;
    }
  }

  constructor(orig = {}, {
    atLineStart,
    inCollection,
    inFlow,
    indent,
    lineStart,
    parent
  } = {}) {
    _defineProperty(this, "parseNode", (overlay, start) => {
      if (_Node.default.atDocumentBoundary(this.src, start)) return null;
      const context = new ParseContext(this, overlay);
      const {
        props,
        type,
        valueStart
      } = context.parseProps(start);
      let node;

      switch (type) {
        case _constants.Type.ALIAS:
          node = new _Alias.default(type, props);
          break;

        case _constants.Type.BLOCK_FOLDED:
        case _constants.Type.BLOCK_LITERAL:
          node = new _BlockValue.default(type, props);
          break;

        case _constants.Type.FLOW_MAP:
        case _constants.Type.FLOW_SEQ:
          node = new _FlowCollection.default(type, props);
          break;

        case _constants.Type.MAP_KEY:
        case _constants.Type.MAP_VALUE:
        case _constants.Type.SEQ_ITEM:
          node = new _CollectionItem.default(type, props);
          break;

        case _constants.Type.COMMENT:
        case _constants.Type.PLAIN:
          node = new _PlainValue.default(type, props);
          break;

        case _constants.Type.QUOTE_DOUBLE:
          node = new _QuoteDouble.default(type, props);
          break;

        case _constants.Type.QUOTE_SINGLE:
          node = new _QuoteSingle.default(type, props);
          break;

        default:
          node.error = new _errors.YAMLSyntaxError(node, `Unknown node type: ${JSON.stringify(type)}`);
          node.range = new _Range.default(start, start + 1);
          return node;
      }

      let offset = node.parse(context, valueStart);
      node.range = new _Range.default(start, offset);

      if (offset <= start) {
        node.error = new Error(`Node#parse consumed no characters`);
        node.error.parseEnd = offset;
        node.error.source = node;
        node.range.end = start + 1;
      }

      if (context.nodeStartsCollection(node)) {
        if (!node.error && !context.atLineStart && context.parent.type === _constants.Type.DOCUMENT) {
          node.error = new _errors.YAMLSyntaxError(node, 'Block collection must not have preceding content here (e.g. directives-end indicator)');
        }

        const collection = new _Collection.default(node);
        offset = collection.parse(new ParseContext(context), offset);
        collection.range = new _Range.default(start, offset);
        return collection;
      }

      return node;
    });

    this.atLineStart = atLineStart != null ? atLineStart : orig.atLineStart || false;
    this.inCollection = inCollection != null ? inCollection : orig.inCollection || false;
    this.inFlow = inFlow != null ? inFlow : orig.inFlow || false;
    this.indent = indent != null ? indent : orig.indent;
    this.lineStart = lineStart != null ? lineStart : orig.lineStart;
    this.parent = parent != null ? parent : orig.parent || {};
    this.root = orig.root;
    this.src = orig.src;
  } // for logging


  get pretty() {
    const obj = {
      start: `${this.lineStart} + ${this.indent}`,
      in: [],
      parent: this.parent.type
    };
    if (!this.atLineStart) obj.start += ' + N';
    if (this.inCollection) obj.in.push('collection');
    if (this.inFlow) obj.in.push('flow');
    return obj;
  }

  nodeStartsCollection(node) {
    const {
      inCollection,
      inFlow,
      src
    } = this;
    if (inCollection || inFlow) return false;
    if (node instanceof _CollectionItem.default) return true; // check for implicit key

    let offset = node.range.end;
    if (src[offset] === '\n' || src[offset - 1] === '\n') return false;
    offset = _Node.default.endOfWhiteSpace(src, offset);
    return src[offset] === ':';
  } // Anchor and tag are before type, which determines the node implementation
  // class; hence this intermediate step.


  parseProps(offset) {
    const {
      inFlow,
      parent,
      src
    } = this;
    const props = [];
    let lineHasProps = false;
    offset = _Node.default.endOfWhiteSpace(src, offset);
    let ch = src[offset];

    while (ch === _constants.Char.ANCHOR || ch === _constants.Char.COMMENT || ch === _constants.Char.TAG || ch === '\n') {
      if (ch === '\n') {
        const lineStart = offset + 1;

        const inEnd = _Node.default.endOfIndent(src, lineStart);

        const indentDiff = inEnd - (lineStart + this.indent);
        const noIndicatorAsIndent = parent.type === _constants.Type.SEQ_ITEM && parent.context.atLineStart;
        if (!_Node.default.nextNodeIsIndented(src[inEnd], indentDiff, !noIndicatorAsIndent)) break;
        this.atLineStart = true;
        this.lineStart = lineStart;
        lineHasProps = false;
        offset = inEnd;
      } else if (ch === _constants.Char.COMMENT) {
        const end = _Node.default.endOfLine(src, offset + 1);

        props.push(new _Range.default(offset, end));
        offset = end;
      } else {
        let end = _Node.default.endOfIdentifier(src, offset + 1);

        if (ch === _constants.Char.TAG && src[end] === ',' && /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+,\d\d\d\d(-\d\d){0,2}\/\S/.test(src.slice(offset + 1, end + 13))) {
          // Let's presume we're dealing with a YAML 1.0 domain tag here, rather
          // than an empty but 'foo.bar' private-tagged node in a flow collection
          // followed without whitespace by a plain string starting with a year
          // or date divided by something.
          end = _Node.default.endOfIdentifier(src, end + 5);
        }

        props.push(new _Range.default(offset, end));
        lineHasProps = true;
        offset = _Node.default.endOfWhiteSpace(src, end);
      }

      ch = src[offset];
    } // '- &a : b' has an anchor on an empty node


    if (lineHasProps && ch === ':' && _Node.default.atBlank(src, offset + 1, true)) offset -= 1;
    const type = ParseContext.parseType(src, offset, inFlow);
    return {
      props,
      type,
      valueStart: offset
    };
  }
  /**
   * Parses a node from the source
   * @param {ParseContext} overlay
   * @param {number} start - Index of first non-whitespace character for the node
   * @returns {?Node} - null if at a document boundary
   */


}

exports.default = ParseContext;

/***/ }),

/***/ 974:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _sourceUtils = __webpack_require__(41);

var _Range = _interopRequireDefault(__webpack_require__(19));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** Root class of all nodes */
class Node {
  static addStringTerminator(src, offset, str) {
    if (str[str.length - 1] === '\n') return str;
    const next = Node.endOfWhiteSpace(src, offset);
    return next >= src.length || src[next] === '\n' ? str + '\n' : str;
  } // ^(---|...)


  static atDocumentBoundary(src, offset, sep) {
    const ch0 = src[offset];
    if (!ch0) return true;
    const prev = src[offset - 1];
    if (prev && prev !== '\n') return false;

    if (sep) {
      if (ch0 !== sep) return false;
    } else {
      if (ch0 !== _constants.Char.DIRECTIVES_END && ch0 !== _constants.Char.DOCUMENT_END) return false;
    }

    const ch1 = src[offset + 1];
    const ch2 = src[offset + 2];
    if (ch1 !== ch0 || ch2 !== ch0) return false;
    const ch3 = src[offset + 3];
    return !ch3 || ch3 === '\n' || ch3 === '\t' || ch3 === ' ';
  }

  static endOfIdentifier(src, offset) {
    let ch = src[offset];
    const isVerbatim = ch === '<';
    const notOk = isVerbatim ? ['\n', '\t', ' ', '>'] : ['\n', '\t', ' ', '[', ']', '{', '}', ','];

    while (ch && notOk.indexOf(ch) === -1) ch = src[offset += 1];

    if (isVerbatim && ch === '>') offset += 1;
    return offset;
  }

  static endOfIndent(src, offset) {
    let ch = src[offset];

    while (ch === ' ') ch = src[offset += 1];

    return offset;
  }

  static endOfLine(src, offset) {
    let ch = src[offset];

    while (ch && ch !== '\n') ch = src[offset += 1];

    return offset;
  }

  static endOfWhiteSpace(src, offset) {
    let ch = src[offset];

    while (ch === '\t' || ch === ' ') ch = src[offset += 1];

    return offset;
  }

  static startOfLine(src, offset) {
    let ch = src[offset - 1];
    if (ch === '\n') return offset;

    while (ch && ch !== '\n') ch = src[offset -= 1];

    return offset + 1;
  }
  /**
   * End of indentation, or null if the line's indent level is not more
   * than `indent`
   *
   * @param {string} src
   * @param {number} indent
   * @param {number} lineStart
   * @returns {?number}
   */


  static endOfBlockIndent(src, indent, lineStart) {
    const inEnd = Node.endOfIndent(src, lineStart);

    if (inEnd > lineStart + indent) {
      return inEnd;
    } else {
      const wsEnd = Node.endOfWhiteSpace(src, inEnd);
      const ch = src[wsEnd];
      if (!ch || ch === '\n') return wsEnd;
    }

    return null;
  }

  static atBlank(src, offset, endAsBlank) {
    const ch = src[offset];
    return ch === '\n' || ch === '\t' || ch === ' ' || endAsBlank && !ch;
  }

  static atCollectionItem(src, offset) {
    const ch = src[offset];
    return (ch === '?' || ch === ':' || ch === '-') && Node.atBlank(src, offset + 1, true);
  }

  static nextNodeIsIndented(ch, indentDiff, indicatorAsIndent) {
    if (!ch || indentDiff < 0) return false;
    if (indentDiff > 0) return true;
    return indicatorAsIndent && ch === '-';
  } // should be at line or string end, or at next non-whitespace char


  static normalizeOffset(src, offset) {
    const ch = src[offset];
    return !ch ? offset : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1 : Node.endOfWhiteSpace(src, offset);
  } // fold single newline into space, multiple newlines to N - 1 newlines
  // presumes src[offset] === '\n'


  static foldNewline(src, offset, indent) {
    let inCount = 0;
    let error = false;
    let fold = '';
    let ch = src[offset + 1];

    while (ch === ' ' || ch === '\t' || ch === '\n') {
      switch (ch) {
        case '\n':
          inCount = 0;
          offset += 1;
          fold += '\n';
          break;

        case '\t':
          if (inCount <= indent) error = true;
          offset = Node.endOfWhiteSpace(src, offset + 2) - 1;
          break;

        case ' ':
          inCount += 1;
          offset += 1;
          break;
      }

      ch = src[offset + 1];
    }

    if (!fold) fold = ' ';
    if (ch && inCount <= indent) error = true;
    return {
      fold,
      offset,
      error
    };
  }

  constructor(type, props, context) {
    Object.defineProperty(this, 'context', {
      value: context || null,
      writable: true
    });
    this.error = null;
    this.range = null;
    this.valueRange = null;
    this.props = props || [];
    this.type = type;
    this.value = null;
  }

  getPropValue(idx, key, skipKey) {
    if (!this.context) return null;
    const {
      src
    } = this.context;
    const prop = this.props[idx];
    return prop && src[prop.start] === key ? src.slice(prop.start + (skipKey ? 1 : 0), prop.end) : null;
  }

  get anchor() {
    for (let i = 0; i < this.props.length; ++i) {
      const anchor = this.getPropValue(i, _constants.Char.ANCHOR, true);
      if (anchor != null) return anchor;
    }

    return null;
  }

  get comment() {
    const comments = [];

    for (let i = 0; i < this.props.length; ++i) {
      const comment = this.getPropValue(i, _constants.Char.COMMENT, true);
      if (comment != null) comments.push(comment);
    }

    return comments.length > 0 ? comments.join('\n') : null;
  }

  commentHasRequiredWhitespace(start) {
    const {
      src
    } = this.context;
    if (this.header && start === this.header.end) return false;
    if (!this.valueRange) return false;
    const {
      end
    } = this.valueRange;
    return start !== end || Node.atBlank(src, end - 1);
  }

  get hasComment() {
    if (this.context) {
      const {
        src
      } = this.context;

      for (let i = 0; i < this.props.length; ++i) {
        if (src[this.props[i].start] === _constants.Char.COMMENT) return true;
      }
    }

    return false;
  }

  get hasProps() {
    if (this.context) {
      const {
        src
      } = this.context;

      for (let i = 0; i < this.props.length; ++i) {
        if (src[this.props[i].start] !== _constants.Char.COMMENT) return true;
      }
    }

    return false;
  }

  get includesTrailingLines() {
    return false;
  }

  get jsonLike() {
    const jsonLikeTypes = [_constants.Type.FLOW_MAP, _constants.Type.FLOW_SEQ, _constants.Type.QUOTE_DOUBLE, _constants.Type.QUOTE_SINGLE];
    return jsonLikeTypes.indexOf(this.type) !== -1;
  }

  get rangeAsLinePos() {
    if (!this.range || !this.context) return undefined;
    const start = (0, _sourceUtils.getLinePos)(this.range.start, this.context.root);
    if (!start) return undefined;
    const end = (0, _sourceUtils.getLinePos)(this.range.end, this.context.root);
    return {
      start,
      end
    };
  }

  get rawValue() {
    if (!this.valueRange || !this.context) return null;
    const {
      start,
      end
    } = this.valueRange;
    return this.context.src.slice(start, end);
  }

  get tag() {
    for (let i = 0; i < this.props.length; ++i) {
      const tag = this.getPropValue(i, _constants.Char.TAG, false);

      if (tag != null) {
        if (tag[1] === '<') {
          return {
            verbatim: tag.slice(2, -1)
          };
        } else {
          // eslint-disable-next-line no-unused-vars
          const [_, handle, suffix] = tag.match(/^(.*!)([^!]*)$/);
          return {
            handle,
            suffix
          };
        }
      }
    }

    return null;
  }

  get valueRangeContainsNewline() {
    if (!this.valueRange || !this.context) return false;
    const {
      start,
      end
    } = this.valueRange;
    const {
      src
    } = this.context;

    for (let i = start; i < end; ++i) {
      if (src[i] === '\n') return true;
    }

    return false;
  }

  parseComment(start) {
    const {
      src
    } = this.context;

    if (src[start] === _constants.Char.COMMENT) {
      const end = Node.endOfLine(src, start + 1);
      const commentRange = new _Range.default(start, end);
      this.props.push(commentRange);
      return end;
    }

    return start;
  }
  /**
   * Populates the `origStart` and `origEnd` values of all ranges for this
   * node. Extended by child classes to handle descendant nodes.
   *
   * @param {number[]} cr - Positions of dropped CR characters
   * @param {number} offset - Starting index of `cr` from the last call
   * @returns {number} - The next offset, matching the one found for `origStart`
   */


  setOrigRanges(cr, offset) {
    if (this.range) offset = this.range.setOrigRange(cr, offset);
    if (this.valueRange) this.valueRange.setOrigRange(cr, offset);
    this.props.forEach(prop => prop.setOrigRange(cr, offset));
    return offset;
  }

  toString() {
    const {
      context: {
        src
      },
      range,
      value
    } = this;
    if (value != null) return value;
    const str = src.slice(range.start, range.end);
    return Node.addStringTerminator(src, range.end, str);
  }

}

exports.default = Node;

/***/ }),

/***/ 986:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tr = __webpack_require__(9);
/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
 * @param     args               optional arguments for tool. Escaping is handled by the lib.
 * @param     options            optional exec options.  See ExecOptions
 * @returns   Promise<number>    exit code
 */
function exec(commandLine, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandArgs = tr.argStringToArray(commandLine);
        if (commandArgs.length === 0) {
            throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
        }
        // Path to tool to execute should be first arg
        const toolPath = commandArgs[0];
        args = commandArgs.slice(1).concat(args || []);
        const runner = new tr.ToolRunner(toolPath, args, options);
        return runner.exec();
    });
}
exports.exec = exec;
//# sourceMappingURL=exec.js.map

/***/ }),

/***/ 996:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _constants = __webpack_require__(49);

var _errors = __webpack_require__(405);

var _stringify = __webpack_require__(454);

var _string = __webpack_require__(591);

var _options = __webpack_require__(422);

/* global atob, btoa, Buffer */
var _default = {
  identify: value => value instanceof Uint8Array,
  // Buffer inherits from Uint8Array
  default: false,
  tag: 'tag:yaml.org,2002:binary',

  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve: (doc, node) => {
    if (typeof Buffer === 'function') {
      const src = (0, _string.resolveString)(doc, node);
      return Buffer.from(src, 'base64');
    } else if (typeof atob === 'function') {
      const src = atob((0, _string.resolveString)(doc, node));
      const buffer = new Uint8Array(src.length);

      for (let i = 0; i < src.length; ++i) buffer[i] = src.charCodeAt(i);

      return buffer;
    } else {
      doc.errors.push(new _errors.YAMLReferenceError(node, 'This environment does not support reading binary tags; either Buffer or atob is required'));
      return null;
    }
  },
  options: _options.binaryOptions,
  stringify: ({
    comment,
    type,
    value
  }, ctx, onComment, onChompKeep) => {
    let src;

    if (typeof Buffer === 'function') {
      src = value instanceof Buffer ? value.toString('base64') : Buffer.from(value.buffer).toString('base64');
    } else if (typeof btoa === 'function') {
      let s = '';

      for (let i = 0; i < value.length; ++i) s += String.fromCharCode(value[i]);

      src = btoa(s);
    } else {
      throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required');
    }

    if (!type) type = _options.binaryOptions.defaultType;

    if (type === _constants.Type.QUOTE_DOUBLE) {
      value = src;
    } else {
      const {
        lineWidth
      } = _options.binaryOptions;
      const n = Math.ceil(src.length / lineWidth);
      const lines = new Array(n);

      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = src.substr(o, lineWidth);
      }

      value = lines.join(type === _constants.Type.BLOCK_LITERAL ? '\n' : ' ');
    }

    return (0, _stringify.stringifyString)({
      comment,
      type,
      value
    }, ctx, onComment, onChompKeep);
  }
};
exports.default = _default;

/***/ })

/******/ });