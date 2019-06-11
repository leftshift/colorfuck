import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faRandom, faStop, faStepForward, faTachometerAlt, faRuler } from '@fortawesome/free-solid-svg-icons';

import Interpreter from './brainfuckInterpreter';

const bfInstructions = ["+", "-", "<", ">", "[", "]", ",", "."];

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
        this.interpreter = new Interpreter(300);
        const machine_state = this.interpreter.state;
        this.state = {
            source: this.constructor._generateRandom(10),
            length: 10,
            speed: 300,
            running: false,
            locked: false,
            memory: machine_state.memory,
            ins_pointer: machine_state.ins_pointer,
            mem_pointer: machine_state.mem_pointer
        };
    }

    updateMachineState() {
        const machine_state = this.interpreter.state;
        this.setState({
            memory: machine_state.memory,
            ins_pointer: machine_state.ins_pointer,
            mem_pointer: machine_state.mem_pointer
        });
    }

    handleChange(event) {
        this.setState({source: event.target.value});
        this.interpreter.source = event.target.value;
    }

    _setLength(event) {
        this.setState({length: event.target.value},
            () => this.random()
        );
    }

    _setSpeed(event) {
        this.setState({speed: event.target.value},
            () => {
                if (this.state.running) {
                    this.stop(this.run);
                }
            }
        )
    }
    
    random() {
        const wasRunning = this.state.running;
        this.reset()
        const source = this.constructor._generateRandom(this.state.length);
        this.setState({
            source: source
        }, () => {
            this.interpreter.source = source;
            if (wasRunning) {
                this.run();
            }
        })
    }

    reset() {
        this.stop();
        this.interpreter.reset();
        this.updateMachineState();
    }

    stop(cb = () => {}) {
        console.debug("stop");
        clearInterval(this.interval);
        this.updateMachineState();
        this.setState({
            running: false,
            locked: false
        }, cb);
    }

    _setStepInterval(ms, count) {
        console.debug(`setting interval to ${ms}ms, ${count} steps`);
        this.interval = setInterval(() => this._runSteps(count), ms);
    }

    run(){
        console.debug("run");
        if (this.state.running) {
            return;
        }
        let speed = this.state.speed;

        const cutoff = 300;
        let interval = Math.max(cutoff - speed, 10);
        let steps = Math.max(speed - cutoff, 1);
        this._setStepInterval(interval, steps);
        this.setState({
            running: true,
            locked: true
        });

    }

    pause(){
        if (! this.state.running) {
            return;
        }
        clearInterval(this.interval);
        this.updateMachineState();
        this.setState({
            running: false,
            locked: true
        });
    }

    _runSteps(number) {
        this.interpreter.steps(number);
        this.updateMachineState();
    }

    static _generateRandomCharacter() {
        const index = Math.floor(bfInstructions.length * Math.random());
        return bfInstructions[index];
    }

    static _generateRandom(length) {
        let source = ""
        while (true) {
            for (let i = 0; i < length; i++) {
                source += this._generateRandomCharacter();
            }
            if (Interpreter.validate(source)) {
                return source;
            } else {
                source = "";
            }
        }
    }

    step() {
        const new_state = this.interpreter.step();
        this.setState({
            locked: true,
            memory: new_state.memory,
            ins_pointer: new_state.ins_pointer,
            mem_pointer: new_state.mem_pointer
        });
        
    }


    render() {
        let box;
        if (this.state.locked) {
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
            <div className="machine">
                <div className="split">
                    <Bitmap
                    memory={this.state.memory}
                    />
                </div>
                <div className="split">
                    <div className="controls">
                        <div className="buttons">
                          <RoundButton onClick={() => this.random()} icon={faRandom}/>
                          <RoundButton onClick={() => this.reset()} icon={faStop}/>
                          { ! this.state.running
                              ? <RoundButton onClick={() => this.run()} icon={faPlay}/>
                              : <RoundButton onClick={() => this.pause()} icon={faPause}/>
                          }
                          <RoundButton onClick={() => this.step()} icon={faStepForward}/>
                        </div>
                        <div className="sliders">
                            <div className="slider">
                              <label for="length"><FontAwesomeIcon icon={faRuler} size="2x"/></label>
                              <Slider
                                  id="length"
                                  min="1"
                                  max="50"
                                  value={this.state.length}
                                  onChange={(event) => this._setLength(event)}
                              />
                            </div>
                            <div className="slider">
                                <label for="speed"><FontAwesomeIcon icon={faTachometerAlt} size="2x"/></label>
                                <Slider
                                    id="speed"
                                    min="1"
                                    max="1000"
                                    value={this.state.speed}
                                    onChange={(event) => this._setSpeed(event)}
                                />
                            </div>
                        </div>
                    </div>
                    {box}
                </div>
            </div>
        )
    }
}

class Slider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 10
        };
    }

    render() {
        return (
            <input
                id={this.props.id}
                type="range"
                min={this.props.min}
                max={this.props.max}
                value={this.props.value}
                onChange={this.props.onChange}
                step="1"
            />
        )
    }
}

class RoundButton extends Component {
    render() {
      return (
        <button onClick={this.props.onClick}><FontAwesomeIcon icon={this.props.icon} size="2x"/></button>
      )
    };
}

class InputBox extends Component {
    render() {
        return (
            <div className="inputBox">
                <textarea
                    onChange={this.props.onChange}
                    value={this.props.source}
                />
            </div>
        )
    }
}

class SourceBox extends Component {
    render() {
        return (
            <div className="sourceBox">
            <pre>
            {this.props.source.slice(0, this.props.pointer)}
            <span className="pointer">
                {this.props.source[this.props.pointer]}
            </span>
            {this.props.source.slice(this.props.pointer + 1)}
            </pre>
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
