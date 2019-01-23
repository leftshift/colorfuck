export default class Interpreter {
    constructor(memsize) {
        this.memsize = memsize;
        this.reset();

        this.source = "";
    }

    reset() {
        this.running = false;

        this._ins_pointer = 0;
        this._mem_pointer = 0;
        this.memory = new Array(this.memsize).fill(0);
        this.stack = [];
    }

    run(interval = 1) {
        this.interval = setInterval(() => this._step(), interval);
    }

    stop() {
        clearInterval(this.interval);
    }

    /**
     * perform step and get resulting machine step
     */
    step() {
        this._step();
        return this.state;
    }

    /**
     * internal processing of a step
     */
    _step() {
        if (!this.running) {
            this.running = true;
        }

        const instruction = this.source[this.ins_pointer];
        switch (instruction) {
            case ">":
                this.mem_pointer += 1;
                this.ins_pointer += 1;
                break;
            case "<":
                this.mem_pointer -= 1;
                this.ins_pointer += 1;
                break;
            case "+":
                this.value += 1;
                this.ins_pointer += 1;
                break;
            case "-":
                this.value -= 1;
                this.ins_pointer += 1;
                break;
            case ".":
                this._putchar();
                this.ins_pointer += 1;
                break;
            case ",":
                this._getchar();
                this.ins_pointer += 1;
                break;
            case "[":
                this._start_loop();
                break;
            case "]":
                this._end_loop();
                break;
            default:
                this.ins_pointer += 1;
                break;
        }
    }

    _putchar() {
        console.log(String.fromCharCode(this.value));
    }

    _getchar() {}

    _start_loop(ins_index) {
        const ins_pointer = this.ins_pointer;
        const val = this.value;
        if (val == 0) {
            this._seek_loop_end();
        } else {
            this.stack.push(ins_pointer);
            this.ins_pointer += 1;
        }
    }

    _end_loop() {
        const mem_pointer = this.mem_pointer;
        const val = this.value;
        if (val != 0) {
            const jump_target = this.stack.pop();
            this.ins_pointer = jump_target;
        } else {
            this.stack.pop();
            this.ins_pointer += 1;
        }
    }

    _seek_loop_end() {
        const ins_pointer = -this.source.split("").map((v, i, l) => {
            if(i<this.state.ins_pointer) {
                return null;
            } else {
                if(v === "[") return +1;
                else if(v === "]") return -1;
                else return null;
            }
        }).reduce((acc, cur, i, l) => {
            if(acc<0) return acc;

            else if(acc === null && cur) return cur;
            else if(acc && cur) return acc + cur;
            else if(acc===0) return -i;
            else return acc;
        }, null);

        this.ins_pointer = ins_pointer;
        
        /*
        let open_count = 0;
        while (true) {
            let instruction = this.state.source[this.state.ins_pointer];
            if (instruction == "[") {
                open_count++;
            } else if (instruction == "]") {
                if (open_count == 0) {
                    return;
                } else {
                    open_count--;
                }
            }
            this.ip_inc(1);
        }
        */
    }

    _posmod(n, m) {
        if (m == 0) {
            return 0;
        }
        return ((n % m) + m) % m;
    }

    get ins_pointer() {
        return this._ins_pointer;
    }

    set ins_pointer(val) {
        const length = this.source.length;
        const next = this._posmod(val, length);
        this._ins_pointer = next;
    }

    get mem_pointer() {
        return this._mem_pointer;
    }

    set mem_pointer(val) {
        const length = this.memsize;
        const next = this._posmod(val, length);
        this._mem_pointer = next;
    }

    /**
     * get value at current memory position
     */
    get value() {
        return this.memory[this.mem_pointer];
    }

    /**
     * set value at current memory position
     */
    set value(val) {
        const size = 256;
        const new_val = this._posmod(val, size);
        this.memory[this.mem_pointer] = new_val;
    }

    /**
     * possibly problematic as this can be run within a step and
     * return inconsistent output
     */
    get state() {
        return new MachineState(
            this.memory, this.ins_pointer, this.mem_pointer
        );
    }
}

export class MachineState {
    constructor(memory, ins_pointer, mem_pointer) {
        this.memory = memory;
        this.ins_pointer = ins_pointer;
        this.mem_pointer = mem_pointer
    }
}
