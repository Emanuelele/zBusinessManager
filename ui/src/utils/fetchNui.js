export const fetchNui = async (eventName, data = {}) => {
    const options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
    };

    // Force resource name for DUI compatibility
    const resourceName = 'zBusinessManager';

    const resp = await fetch(`https://${resourceName}/${eventName}`, options);

    const respFormatted = await resp.json();

    return respFormatted;
};
