router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Газрын мэдээлэл олдсонгүй"
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Серверийн алдаа"
    });
  }
});