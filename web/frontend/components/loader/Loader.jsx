import { Oval } from 'react-loader-spinner'
import "./style.css";

export function Loader() {
    return (
        <div className="loader">
            <Oval
                height={60}
                width={60}
                color="#ff6900"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel='oval-loading'
                secondaryColor="#FFFFFF"
                strokeWidth={3}
                strokeWidthSecondary={3}

            />
        </div>
    );
}