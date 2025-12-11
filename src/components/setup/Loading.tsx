import Logo2 from "../../assets/logo-2.svg";
import { useSession } from "../../providers";

import "../../styles/setup.css";

export default function Loading() {
  const { sid } = useSession();
  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center p-10">
      <img src={Logo2} alt="yellow-logo" />
      <div
        className="loading-container flex flex-col gap-10 rounded-md shadow-2xl
         text-black text-center justify-center items-center
          p-[15px] min-h-[200px] min-w-[300px] z-999 bg-white"
      >
        <h3 className="font-bold">Loading your session</h3>
        <div className="spinner-3"></div>
        <div id="code" className="font-bold text-[#062F8F]">
          {sid || ""}
        </div>
      </div>
      <div
        className="bg-[#062F8F]
        text-center rounded-md p-1
        min-w-[300px] min-h-10 font-bold"
      >
        Cancel
      </div>
    </div>
  );
}
