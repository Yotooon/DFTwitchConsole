import React from 'react'
import { Q3STR } from '../../partials/Quake3'

export default function Row(props) {
    if(!props.data) {
        return null
    }
    
    if(props.data.content === "") {
        return null
    }

    if(props.data.type === 'SAY') {
        return (
            <div className="row">
                <div className="col timestamp">{props.data.time}</div>
                <div className="col player-name"><Q3STR s={props.data.author}/>:</div>
                <div className="col message"><Q3STR s={props.data.content}/></div>
            </div>
        )
    }

    if(props.data.type === 'PRINT' || props.data.type === 'ANNOUNCE') {
        return (
            <div className="row -announce">
                <div className="col timestamp">{props.data.time}</div>
                <div className="col message"><Q3STR s={props.data.content}/></div>
            </div>
        )
    }

    return null
}

export function RowNotify(props) {
    if(!props.data) {
        return null
    }
    
    if(props.data.content === "") {
        return null
    }

	if(props.data.type === 'SAY') {
		return (
			<div className="line-wrap">
				<div className="player-name"><Q3STR s={props.data.author}/>:</div>
				<div className="message"><Q3STR s={props.data.content}/></div>
			</div>
		)
	}

	if(props.data.type === 'PRINT' || props.data.type === 'ANNOUNCE') {
		return (
			<div className="line-wrap">
				<div className="message"><Q3STR s={props.data.content}/></div>
			</div>
		)
	}

    return null
}