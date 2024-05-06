import { Modal } from "../modal";
import "./style.css";

export function ErrorModal(props) {
    return (
        <Modal {...props} width="30%" zIndex= "999999">
            <div className="error-modal">
                <div className="error-header">
                    Error!
                </div>
                <div className="success-tex">
                    {props.message}
                </div>
                <div className="success-btn">
                    <button className="submit-btn" onClick={() => props.onConfirm()}>
                        OK
                    </button>
                </div>
            </div>
        </Modal>
    );
}