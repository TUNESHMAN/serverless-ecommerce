const environnments = {
    dev: {
      branchName: 'dev',
      retainResource: true,
      useTestHarness: false,
      hostedZoneName: 'babsdev.ecommerce.com',
      hostedZoneId: 'Z06789152JJO7C2UDHLTLT',
      domain: 'dev.babs.ecommerce.com',
      certId: 'babsdev.ecommerce.com',
    //   parameterStoreKeys: ['/test/talos/username', '/test/talos/password'],
   
    },
    prod: {
      branchName: 'prod',
      retainResource: true,
      useTestHarness: false,
      hostedZoneName: 'babsdev.ecommerce.com', //needs to change
      hostedZoneId: 'Z047354922JG0PKNXJFHJT', //needs to change
      domain: 'dev.babs.ecommerce.com', //needs to change
      certId: '1d771807-a836-4d07-9f00-1a0881ef8165T', //needs to change
    //   parameterStoreKeys: ['/test/talos/username', '/test/talos/password'], //needs to change
     
    },
  };
  
  export const setEnv = function (stage?: string) {
    const branchName = stage ? stage.toLowerCase() : 'dev';
    if (branchName === 'prod' || branchName == 'dev') {
      return environnments[branchName];
    } else {
      const envName = branchName;
      return {
        branchName: envName,
        retainResource: false,
        useTestHarness: true,
        hostedZoneName: 'babsdev.ecommerce.com',
        hostedZoneId: 'Z06789152JJO7C2UDHLTLT',
        domain: `${envName}.babsdev.ecommerce.com`,
        certId: 'b3266c1d-5f12-4230-9864-d61a3a81afc13T',
        // parameterStoreKeys: ['/test/talos/username', '/test/talos/password'],
      };
    }
  };
  