import React, { Component } from 'react';

export default class App extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
        <Machine
        />
        )
    }
}

class Machine extends Component { 
    constructor(props) {
        super(props);
        this.state = {
            source: "",
            memory: new Array(300).fill(0),
            running: false,
            mem_pointer: 0,
            ins_pointer: 0,
            stack: []
        };
    }

    handleChange(event) {
        this.setState({source: event.target.value});
    }
    
    posmod(n, m) {
        if (m == 0) {
            return 0;
        }
        return ((n % m) + m) % m;
    }

    random() {}
    stop() {
        this.setState({
            ins_pointer: 0,
            running: false,
            memory: new Array(300).fill(0),
        })
    }
    run(){}
    step() {
        if (this.state.running == false) {
            this.setState({running: true});
            return;
        }

        const instruction = this.state.source[this.state.ins_pointer];
        switch (instruction) {
            case ">":
                this.mp_inc(1);
                this.ip_inc(1);
                break;
            case "<":
                this.mp_inc(-1);
                this.ip_inc(1);
                break;
            case "+":
                this.v_inc(1);
                this.ip_inc(1);
                break;
            case "-":
                this.v_inc(-1);
                this.ip_inc(1);
                break;
            case ".":
                this.putchar();
                this.ip_inc(1);
                break;
            case ",":
                this.getchar();
                this.ip_inc(1);
                break;
            case "[":
                this.start_loop();
                break;
            case "]":
                this.end_loop();
                break;
        }
    }

    ip_inc(n) {
        const len = this.state.source.length;
        const next = this.posmod(this.state.ins_pointer + n, len);
        this.setState({ins_pointer: next});
    }

    mp_inc(n) {
        const len = this.state.memory.length;
        const next = this.posmod(this.state.mem_pointer + n, len);
        this.setState({mem_pointer: next});
    }

    v_inc(n) {
        const mem_pointer = this.state.mem_pointer;
        const len = 255;
        let new_mem = this.state.memory;
        new_mem[mem_pointer] = this.posmod(this.state.memory[mem_pointer] + n, len);
        this.setState({memory: new_mem});
    }
    putchar() {}
    getchar() {}
    start_loop(ins_index) {
        const ins_pointer = this.state.ins_pointer
        const mem_pointer = this.state.mem_pointer;
        const val = this.state.memory[mem_pointer];
        if (val == 0) {
            this.seek_loop_end();
        } else {
            this.setState({stack: [...this.state.stack, ins_pointer]});
            this.ip_inc(1);
        }
    }
    end_loop() {
        const mem_pointer = this.state.mem_pointer;
        const val = this.state.memory[mem_pointer];
        if (val != 0) {
            const jump_target = this.state.stack.slice(-1)[0];
            let new_stack = this.state.stack.slice(0, -1);
            this.setState({stack: new_stack, ins_pointer: jump_target});
        }
    }

    seek_loop_end() {
        const ins_pointer = -this.state.source.split("").map((v, i, l) => {
            if(i<this.state.ins_pointer) {
                return null;
            } else {
                if(v === "[") return +1;
                else if(v === "]") return -1;
                else return null;
            }
        }).reduce((acc, cur, i) => {
            if(i<0) return i;

            if(acc === null && cur == null) return null;
            else if(acc === null && i) return i;
            else if(acc && i) return acc + i;
            else if(acc===0) return -i;
        }, null);

        debugger;
        this.setState({ins_pointer});
        
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


    render() {
        let box;
        if (this.state.running) {
            box = <SourceBox
                source={this.state.source}
                pointer={this.state.ins_pointer}
                />
        } else {
            box = <InputBox
                source={this.state.source}
                onChange={(event) => this.handleChange(event)}
                />
        }
        return (
            <div>
                <button onClick={() => this.random()}>🔀</button>
                <button onClick={() => this.stop()}>⏹️</button>
                <button onClick={() => this.run()}>▶️</button>
                <button onClick={() => this.step()}>⏭️</button>
                <Bitmap
                memory={this.state.memory}
                />
                {box}
            </div>
        )
    }
}

class InputBox extends Component {
    render() {
        return (
            <textarea className="inputBox"
                onChange={this.props.onChange}
                value={this.props.source}
            />
        )
    }
}

class SourceBox extends Component {
    render() {
        return (
            <div className="sourceBox">
            {this.props.source.slice(0, this.props.pointer)}
            <span className="pointer">
                {this.props.source[this.props.pointer]}
            </span>
            {this.props.source.slice(this.props.pointer + 1)}
            </div>
        )
    }
}

class Bitmap extends Component {
    render() {
        const mem = this.props.memory;

        // var pixels = Array(Math.floor(mem.length / 3))
        const pixels = mem.map((v, i, l) => i % 3 == 0 ? <Pixel key={i} r={v} g={l[i+1]} b={l[i+2]} /> : null).filter(v => v);

//        for (var i=0; i<mem.length; i = i+3) {
//            pixels.push(
//                <Pixel
//                key={i}
//                r={mem[i]}
//                g={mem[i+1]}
//                b={mem[i+2]}
//                />
//            )
//        }
        return (
            <div className="bitmap">
            {pixels}
            </div>
        )
    }
}

class Pixel extends Component {
    render() {
        const {r, g, b} = this.props;
        const style = {
            backgroundColor: `rgb(${r}, ${g}, ${b})`,
        }
        return (
            <div className="pixel"
            style={style}
            />
        )
    }
}
