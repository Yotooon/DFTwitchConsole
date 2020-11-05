import React from 'react'
import Authentication from '../../util/Authentication/Authentication'

import './App.scss'
import { Q3STR } from '../../partials/Quake3'
import Message from '../../partials/StatusMessages'

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.Authentication = new Authentication()

        // If the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null
        
        this.state = {
            finishedLoading: false,
            theme: 'light',
            isVisible: true,
            arePlayerControlsVisible: false,

            isOpen: false,

            // format {type: 'info|success|warning|error', 'message': '<string>'}
            status_message: null,
            messages: [
                {
                    'author': '^7UnnamedPlayer',
                    'message': 'Just a test bruv!',
                    'time': '11:00:00',
                }
            ],
        }

        // input element ref
        this.inputEl = React.createRef()
        this.scrollerEl = React.createRef()

        this.toggleConsole = this.toggleConsole.bind(this)
        this.onKeyPress = this.onKeyPress.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
    }

    contextUpdate(context, delta) {
        if(delta.includes('theme')) {
            this.setState(() => {
                return { theme: context.theme }
            })
        } else if(delta.includes('arePlayerControlsVisible')) {
            this.setState(() => {
                return { arePlayerControlsVisible: context.arePlayerControlsVisible }
            })
        }
    }

    visibilityChanged(isVisible) {
        this.setState(() => {
            return {
                isVisible
            }
        })
    }

    toggleConsole(e) {
        this.setState({
            isOpen: !this.state.isOpen
        }, () => {
            if(this.state.isOpen) {
                // Focus on the input
                this.inputEl.current.focus()

                // Keep the scrollbar at the bottom
                this.scrollerEl.current.scrollTop = this.scrollerEl.current.scrollHeight - this.scrollerEl.current.clientHeight
            }
        })
    }

    sendMessage() {
        let me = '^7>>^3/^7yotoon'
        let msg = this.inputEl.current.value.trim()
        let date = new Date()

        if(this.state.status_message !== null) {
            return
        }

        if(msg === '') {
            this.setState({
                status_message: {
                    'type': 'warning',
                    'message': 'Your message cannot be blank',
                }
            }, () => {
                // Hide the message after X amount of time
                setTimeout(() => {
                    this.setState({ status_message: null })
                }, 3500)
            })
            return
        }

        let new_msg = {
            'author': me,
            'message': msg,
            'time': date.toLocaleTimeString('pl-PL'),
        }

        this.state.messages.push(new_msg)

        this.setState({
            messages: this.state.messages
        }, () => {
            this.inputEl.current.value = ''
            this.scrollerEl.current.scrollTop = this.scrollerEl.current.scrollHeight - this.scrollerEl.current.clientHeight
        })
    }

    onKeyPress(e) {
        // '~' [key] = 'Backquote' [code]
        let key = e.code

        if(key === 'Backquote') {
            e.preventDefault()
            this.toggleConsole()
            return
        }

        // Send a new console message (if the input element is focused)
        if(this.inputEl.current === document.activeElement && (key === 'Enter' || key === 'NumpadEnter')) {
            e.preventDefault()
            this.sendMessage()
        }
    }

    componentDidMount() {
        if(this.twitch) {
            this.twitch.onAuthorized((auth) => {
                this.Authentication.setToken(auth.token, auth.userId)

                if(!this.state.finishedLoading) {
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState(() => {
                        return { finishedLoading: true }
                    })
                }
            })

            this.twitch.listen('broadcast', (target, contentType, body) => {
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)

                // now that you've got a listener, do something with the result... 
            })

            this.twitch.onVisibilityChanged((isVisible, _c) => {
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context, delta) => {
                this.contextUpdate(context, delta)
            })

            document.addEventListener('keypress', this.onKeyPress)
        }
    }

    componentWillUnmount() {
        if(this.twitch) {
            this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))

            document.removeEventListener('keypress', this.onKeyPress)
        }
    }
    
    render() {
        if(this.state.finishedLoading && this.state.isVisible) {
            let statusMessage = this.state.status_message !== null ? <Message type={this.state.status_message.type} message={this.state.status_message.message}/> : null

            return (
                <div className={`app-wrap theme-${this.state.theme} console-${this.state.isOpen ? 'opened' : 'closed'} controls-${this.state.arePlayerControlsVisible ? 'visible' : 'hidden'}`}>
                    <div className="console-button" onClick={this.toggleConsole}>~</div>
                    <div className="console-wrap">
                        <div className="console-content-wrap">
                            <div className="console-scroller" ref={this.scrollerEl}>
                                <div className="rows-wrap">
                                    {this.state.messages.map((val) => {
                                        return (
                                            <div className="row">
                                                <div className="col timestamp">{val.time}</div>
                                                <div className="col player-name"><Q3STR s={val.author}/>:</div>
                                                <div className="col message">{val.message}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="console-input-wrap">
                            <div className="close-console-button" onClick={this.toggleConsole}>Close</div>
                            <div className="input-element-wrap">
                                {statusMessage}
                                <input type="text" className="input" ref={this.inputEl}/>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="app-wrap"></div>
            )
        }

    }
}

/*
<p>Hello world! <input type="button" value="Minimize" onClick={this.twitch.actions.minimize}/></p>
<p>IsVisible: {this.state.isVisible ? 'Yes': 'No'}</p>
<p>My token is: {this.Authentication.state.token}</p>
<p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
<div>{this.Authentication.isModerator() ? <p>I am currently a mod, and here's a special mod button <input value='mod button' type='button'/></p>  : 'I am currently not a mod.'}</div>
<p>I have {this.Authentication.hasSharedId() ? `shared my ID, and my user_id is ${this.Authentication.getUserId()}` : 'not shared my ID'}.</p>
*/