import "../styles/Login.css";
import LoginForm from "../components/LoginForm";
import {
  FaBrain,
  FaChartLine,
  FaCamera,
  FaUsers,
  FaShieldAlt
} from "react-icons/fa";

function Login() {
  return (
    <div className="login-container">

      {/* Left Panel */}
      <div className="left-panel">
        <div className="overlay">

          <div className="brand-logo">
            AI
          </div>

          <h1>
            Consumer Attention
            <br />
            Mapping System
          </h1>

          <p className="subtitle">
            AI Powered Retail Intelligence Platform
          </p>

          <div className="tech-line"></div>

          <div className="features">

            <div className="feature">
              <FaBrain />
              <span>Artificial Intelligence Detection</span>
            </div>

            <div className="feature">
              <FaCamera />
              <span>Live Camera Monitoring</span>
            </div>

            <div className="feature">
              <FaChartLine />
              <span>Real-Time Analytics Dashboard</span>
            </div>

            <div className="feature">
              <FaUsers />
              <span>Consumer Behaviour Analysis</span>
            </div>

            <div className="feature">
              <FaShieldAlt />
              <span>Secure Role Based Access</span>
            </div>

          </div>

        </div>
      </div>

      {/* Right Panel */}

      <div className="right-panel">
        <LoginForm />
      </div>

    </div>
  );
}

export default Login;