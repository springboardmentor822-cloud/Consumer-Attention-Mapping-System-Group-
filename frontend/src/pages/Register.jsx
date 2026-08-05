import "../styles/Login.css";
import RegisterForm from "../components/RegisterForm";

function Register() {

  return (

    <div className="login-container">

      <div className="left-panel">

        <div className="overlay">

          <h1>

            Consumer Attention

            <br />

            Mapping System

          </h1>

          <p>

            AI Powered Retail Intelligence Platform

          </p>

          <div className="tech-line"></div>

        </div>

      </div>

      <div className="right-panel">

        <RegisterForm />

      </div>

    </div>

  );

}

export default Register;