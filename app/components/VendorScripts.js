"use client";
import Script from "next/script";

const VendorScripts = () => (
  <>
    {/* For scripts that should only be loaded in prod environment */}
    {process.env.NEXT_PUBLIC_LOAD_TRACKING_SCRIPTS === "true" && (
      <>
        <Script
          id="GoogleTagManager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: ``,
          }}
        />
        {/* <!-- Google Tag Manager (noscript) --> */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `
                            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PFZZ2KW"
                            height="0" width="0" style="display:none;visibility:hidden"></iframe>
                        `,
          }}
        />
        {/* <!-- End Google Tag Manager (noscript) --> */}
      </>
    )}
  </>
);

export default VendorScripts;
