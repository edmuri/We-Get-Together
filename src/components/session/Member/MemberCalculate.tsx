import Globe from "../../../assets/globe.svg";

export default function MemberCalculate() {
  return (
    <div className="flex flex-col gap-4 w-full items-center justify-center">
      <b>
        Waiting for Host to
        <br /> calculate midpoint
      </b>
      <img src={Globe} alt="globe" width="100px" />
    </div>
  );
}
