import Client from "../models/clientModel.js";
import Location from "../models/locationModel.js";

export const getClientInfo = async (req, res) => {
  const { id } = req.params;

  try {
    if (id) {
      const data = await Client.findById(id).populate({
        path: "locations",
        select: "floor location subLocations",
      });

      if (!data) return res.status(404).json({ message: "Client not found" });
      return res.status(200).json(data);
    }

    const data = await Client.find({}).select("name");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
