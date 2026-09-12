import "../../styles/store-download-buttons.css";

const storeEnvironment = (
  import.meta as ImportMeta & {
    env: { VITE_APP_STORE_URL?: string; VITE_GOOGLE_PLAY_URL?: string };
  }
).env;
const googlePlayUrl =
  storeEnvironment.VITE_GOOGLE_PLAY_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=com.twobeone.app";
// The iOS badge uses the existing installer until a published listing is configured.
const appStoreUrl = storeEnvironment.VITE_APP_STORE_URL?.trim();

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="sdb-icon sdb-icon--apple"
    >
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.1ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z"
      />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg
      viewBox="0 0 32 36"
      aria-hidden="true"
      className="sdb-icon sdb-icon--play"
    >
      <path
        d="M2 2.5 19 18 2 33.5a3 3 0 0 1-1-2.3V4.8c0-.9.3-1.7 1-2.3Z"
        fill="#45c4f4"
      />
      <path
        d="m19 18 5.5-5.1 5 2.8c1.8 1 1.8 3.6 0 4.6l-5 2.8L19 18Z"
        fill="#ffcf47"
      />
      <path d="M2 2.5c1-.9 2.3-1 3.5-.3l19 10.7L19 18 2 2.5Z" fill="#63d88a" />
      <path
        d="M2 33.5 19 18l5.5 5.1-19 10.7c-1.2.7-2.5.6-3.5-.3Z"
        fill="#f46c77"
      />
    </svg>
  );
}

export function StoreDownloadButtons({
  onInstallIOS,
}: {
  onInstallIOS: () => void;
}) {
  return (
    <div className="sdb-downloads">
      <div className="sdb-badges" role="group" aria-label="Download TwoBeOne">
        <a
          className="sdb-badge"
          href={googlePlayUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download TwoBeOne on Google Play"
        >
          <GooglePlayIcon />
          <span>
            <small>GET IT ON</small>
            <strong>Google Play</strong>
          </span>
        </a>
        {appStoreUrl ? (
          <a
            className="sdb-badge"
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download TwoBeOne on the App Store"
          >
            <AppleIcon />
            <span>
              <small>Download on the</small>
              <strong>App Store</strong>
            </span>
          </a>
        ) : (
          <button
            className="sdb-badge"
            type="button"
            onClick={onInstallIOS}
            aria-label="Install TwoBeOne on iPhone or iPad: open installation guide"
          >
            <AppleIcon />
            <span>
              <small>INSTALL ON YOUR</small>
              <strong>iPhone &amp; iPad</strong>
            </span>
          </button>
        )}
      </div>
      {!appStoreUrl && (
        <p className="sdb-install-note">
          iPhone &amp; iPad: add to your Home Screen from Safari.
        </p>
      )}
    </div>
  );
}
