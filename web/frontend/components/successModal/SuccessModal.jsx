import { Modal } from "../modal";
import "./style.css";

export function SuccessModal(props) {
    return (
        <Modal {...props} width="30%">
            <div className="success-modal">
                <div className="success-header">
                    Success!
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