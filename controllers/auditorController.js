import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";

export const getClientInfo = async (req, res) => {
  const { id } = req.params;
  try {
    const [clients,locations,floors]=Promise.all([
      Client.find({}).select('name phone contractNo'),
      Location.find({})
    ])
  } catch (error) {
    res.status(500).json(error);
  }
};
