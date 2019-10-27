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

        // to make the query parameter look a bit nicer, we treat `+` as a literal plus, not as a space (as is common). Spaces may still be encoded as %20.
        // However, URLSearchParams honers this convention, so we replace all + with the %-representation of + so they aren't treated as spaces
        const params = window.location.search.replace(/\+/g, "%2B");
        const urlParams = new URLSearchParams(params);
        this.state = {
            source: urlParams.get("s") || this.constructor._generateRandom(14),
            lastPushedSource: "",
            lastPushedSpeed: "",
            length: 14,
            speed: Number(urlParams.get("speed")) || 300,
            running: false,
            locked: false,
            memory: machine_state.memory,
            ins_pointer: machine_state.ins_pointer,
            mem_pointer: machine_state.mem_pointer
        };
        this._attachHistoryListener();
    }

    _attachHistoryListener() {
        window.onpopstate = event => {
            this.setState({
                source: event.state.source,
                lastPushedSource: event.state.source,
                speed: event.state.speed,
                lastPushedSpeed: event.state.speed,
            });
            this.reset();
        }
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
        this.setState({source: event.target.value}, () => {
          history.replaceState(
            {source: this.state.source, speed: this.state.speed},
            'Colorfuck', '?speed=' + this.state.speed + "&s=" + this.state.source
          );
        });
    }

    _setLength(event) {
        this.setState({length: event.target.value},
            () => this.random(false)
        );
    }

    _setSpeed(event) {
        this.setState({speed: event.target.value},
            () => {
                if (this.state.running) {
                    this.stop(this.run);
                }
                history.replaceState(
                  {source: this.state.source, speed: this.state.speed},
                  'Colorfuck', '?speed=' + this.state.speed + "&s=" + this.state.source
                );
            }
        )
    }


    random(autostart) {
        const wasRunning = this.state.running;
        this.reset()
        const source = this.constructor._generateRandom(this.state.length);
        this.setState({
            source: source
        }, () => {
            this.interpreter.source = source;
            if (wasRunning || autostart) {
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
        this.interpreter.source = this.state.source;

        const cutoff = 300;
        let interval = Math.max(cutoff - speed, 10);
        let steps = Math.max(speed - cutoff, 1);
        this._setStepInterval(interval, steps);
        this.setState({
            running: true,
            locked: true
        });
        if (this.state.lastPushedSource != this.state.source || this.state.lastPushedSpeed != this.state.speed) {
            history.pushState(
              {source: this.state.source, speed: this.state.speed},
              'Colorfuck', '?speed=' + this.state.speed + "&s=" + this.state.source
            );
            this.setState({
                lastPushedSource: this.state.source,
		lastPushedSpeed: this.state.speed,
            });
        }
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
                          <RoundButton
                            onClick={() => this.random(true)}
                            icon={faRandom}
                            title="generate new random sample">
                              <span>Go!</span>
                          </RoundButton>
                          { ! this.state.running
                              ? <RoundButton onClick={() => this.run()} icon={faPlay} title="run"/>
                              : <RoundButton onClick={() => this.pause()} icon={faPause} title="stop"/>
                          }
                          <RoundButton
                            onClick={() => this.step()}
                            icon={faStepForward}
                            disabled={this.state.running}
                            title="run single step"/>
                          <RoundButton
                            onClick={() => this.reset()}
                            icon={faStop}
                            title="stop"/>
                        </div>
                        <div className="sliders">
                            <div className="slider">
                              <label htmlFor="length"><FontAwesomeIcon icon={faRuler} size="1x"/> Length</label>
                              <Slider
                                  id="length"
                                  min="1"
                                  max="50"
                                  value={this.state.length}
                                  onChange={(event) => this._setLength(event)}
                              />
                            </div>
                            <div className="slider">
                                <label htmlFor="speed"><FontAwesomeIcon icon={faTachometerAlt} size="1x" id="speed"/> Speed</label>
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
        <button onClick={this.props.onClick} disabled={this.props.disabled} title={this.props.title}>
          <div className="buttonIconBox">
            <FontAwesomeIcon icon={this.props.icon} size="1x"/>
          </div>
          {this.props.children}
        </button>
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
