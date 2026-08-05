import "../styles/Login.css";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

function ForgotPassword() {

  return (

    <div className="login-container">

      <div className="left-panel">

        <div className="overlay">

          <h1>

            Consumer Attention

            <br/>

            Mapping System

          </h1>

          <p>

            Reset your account password

          </p>

          <div className="tech-line"></div>

        </div>

      </div>

      <div className="right-panel">

        <ForgotPasswordForm/>

      </div>

    </div>

  );

}

export default ForgotPassword;