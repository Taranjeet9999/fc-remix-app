import { Modal } from "../modal";
import "./style.css";

export function ConfirmModal(props) {
    return (
        <Modal {...props} width="30%">
            <div className="confirm-modal">
                <div className="confirm-header">
                    Are you sure?
                </div>
                <div className="success-tex">
                    {props.message}
                </div>
                <div className="confirm-btn">
                    <button className="cancel-btn" onClick={() => props.onCancel()}>
                        Cancel
                    </button>
                    <button className="submit-btn" onClick={() => props.onConfirm()}>
                        Ok
                    </button>
                </div>
            </div>
        </Modal>
    );
}