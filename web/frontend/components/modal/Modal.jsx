import "./style.css";

export function Modal(props) {
    return (
        <div className={`modal-main  ${props.className ?? ""}`}   style={{ display: props.showModal ? "flex" : "none", zIndex: props.zIndex }}>
            <div className="modal-inner" style={{ width: props.width }}>
                {props.children}
            </div>
        </div>
    );
}