import Client from "../models/Client.js";

const clientIdGenerator = {
    generateNextId: async (prefix = 'CL') => {
        const lastClient = await Client.findOne().sort({ ID: -1 });
        
        let nextNumber = 1;
        if (lastClient?.ID) {
            const matches = lastClient.ID.match(/\d+$/);
            if (matches) nextNumber = parseInt(matches[0]) + 1;
        }
        
        return `${prefix}-${nextNumber.toString().padStart(2, '0')}`;
    },

    generateBatchIds: async (count, prefix = 'CL') => {
        const lastClient = await Client.findOne().sort({ ID: -1 });
        
        let startNumber = 1;
        if (lastClient?.ID) {
            const matches = lastClient.ID.match(/\d+$/);
            if (matches) startNumber = parseInt(matches[0]) + 1;
        }
        
        return Array.from({ length: count }, (_, i) => 
            `${prefix}-${(startNumber + i).toString().padStart(2, '0')}`
        );
    }
};


export default clientIdGenerator;