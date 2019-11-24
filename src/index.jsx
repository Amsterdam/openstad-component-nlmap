import React from 'react';
import ReactDOM from 'react-dom';

import "./css/default.less";

import OpenStadComponentNLMap from './component/map.jsx';
export {OpenStadComponentNLMap}

window.addEventListener("load", function() {
	let elements = document.querySelectorAll('.openstad-component-nlmap');
	elements.forEach((elem) => {
    let attributes = elem.attributes;
		ReactDOM.render( <OpenStadComponentNLMap attributes={attributes}/>, elem)
	})
})
