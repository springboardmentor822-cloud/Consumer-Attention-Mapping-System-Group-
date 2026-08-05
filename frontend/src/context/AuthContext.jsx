import {
  createContext,
  useState,
  useEffect,
} from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const savedUser = localStorage.getItem("user");

    if (savedUser) {

      setUser(JSON.parse(savedUser));

    }

    setLoading(false);

  }, []);

  const login = (data) => {

    localStorage.setItem(
      "token",
      data.access_token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    localStorage.setItem(
      "role",
      data.user.role
    );

    setUser(data.user);

  };

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setUser(null);

    window.location.href = "/login";

  };

  return (

    <AuthContext.Provider

      value={{

        user,

        loading,

        login,

        logout,

        isAuthenticated: !!user,

      }}

    >

      {children}

    </AuthContext.Provider>

  );

}

export default AuthProvider;