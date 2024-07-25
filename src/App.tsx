import { useFlag } from "@openfeature/react-sdk";

import reactLogo from "./assets/react.svg";
import flagsmithExample from "./assets/example.png";

const MISSING_FLAG_KEY = "missing-flag-key";
const ENABLED_FLAG_WITH_FALSEY_VALUE_KEY = "enabled-flag-with-falsey-value";

function App() {
  const { value: isClockWise, details: missingFlagDetails } = useFlag(
    MISSING_FLAG_KEY,
    true
  );
  const { value: isGrayscale, details: enabledFlagWithFalseyValueDetails } =
    useFlag(ENABLED_FLAG_WITH_FALSEY_VALUE_KEY, false);

  // debugging ui, not relevant to the bug scenario:
  const logoClassName = [
    "logo",
    "react",
    isClockWise && "is-clockwise",
    isGrayscale && "is-grayscale",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <img src={reactLogo} className={logoClassName} alt="React logo" />
      <p>
        <code>{MISSING_FLAG_KEY}</code> should have{" "}
        <code className="string">"reason"</code> set to{" "}
        <code className="string">"DEFAULT"</code> and{" "}
        <code className="string">"value"</code> of{" "}
        <code className="value">true</code>;
      </p>
      <p>
        <code>{ENABLED_FLAG_WITH_FALSEY_VALUE_KEY}</code> should have{" "}
        <code className="string">"value"</code> set to{" "}
        <code className="value">false</code>
        <br />
        when it has <code className="string">enabled</code> set to{" "}
        <code className="value">true</code>, but with a{" "}
        <code className="string">"value"</code> set to{" "}
        <code className="value">false</code>.<br />
        <br />
        This is useful when your flag is on,
        <br />
        but a subset of your clients are being overriden by a segment or
        identity.
      </p>
      <img src={flagsmithExample} alt="example flagsmith interface" />
      <pre>
        {JSON.stringify(
          {
            [MISSING_FLAG_KEY]: missingFlagDetails,
            [ENABLED_FLAG_WITH_FALSEY_VALUE_KEY]:
              enabledFlagWithFalseyValueDetails,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}

export default App;
