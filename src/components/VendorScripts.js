import { useEffect } from "react";

const VendorScripts = () => {
  useEffect(() => {
    // Add any script loading logic here if needed
  }, []);

  return (
    <>
      <script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" async defer />
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </script>
    </>
  );
};

export default VendorScripts;
