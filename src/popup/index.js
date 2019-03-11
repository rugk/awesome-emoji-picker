/**
 * Starter module for popup.
 *
 */
"use strict";
/* globals React ReactDOM */

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
    }

    render() {
        if (this.state.liked) {
            return "You liked this.";
        }

        return React.createElement(
            "button",
            { onClick: () => this.setState({ liked: true }) },
            "Like"
        );
    }
}
debugger;
const domContainer = document.querySelector("#reactContainer");
ReactDOM.render(React.createElement(Picker), domContainer);
