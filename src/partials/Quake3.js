import React from 'react'

const q3regex = /\^([0-9]{1})(.?[^\^]+)/gi

export function Q3STR(props) {
    let newstr = props.s.replace(q3regex, '<span class="qcolor$1">$2</span>')
    return (
        <span dangerouslySetInnerHTML={{ __html: newstr }}/>
    )
}