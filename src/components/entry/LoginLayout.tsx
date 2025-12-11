import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Globe from "../../assets/globe.svg";
import Logo from "../../assets/logo.svg";

export default function LoginLayout({
  children,
  location = false,
}: {
  children: ReactNode;
  location?: boolean;
}) {
  return (
    <motion.div
      initial={{ y: 30, scale: 0.95, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="flex flex-col h-screen w-screen items-center justify-center  p-10"
    >
      {/* <div className="font-bold mb-[15px]">
        <h2>We</h2>
        <h1>Get Together</h1>
      </div> */}

      <motion.h3
        className="text-white font-bold"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 18,
          delay: 0.05,
        }}
      >
        <h2>We</h2>
        <h1>Get Together</h1>
      </motion.h3>

      {location === true ? (
        <img src={Globe} alt="globe" className="z-[-999] w-[220px] h-[200px]" />
      ) : (
        <img src={Logo} alt="logo" className="" />
      )}
      <div
        id="login-container"
        className="flex flex-col gap-10 rounded-md shadow-2xl
         text-black text-center justify-center items-center
        bg-white p-[15px] min-h-[400px] min-w-[300px] z-999"
      >
        {children}
      </div>
    </motion.div>
  );
}
