const decrementResourceCount = async (resources, model, field) => {
    for (const resource of resources) {
      const item = await model.findById(resource._id);
      if (!item) {
        throw new Error(`${field} not found: ${resource._id}`);
      }
      if (item.amount_available < resource.amount_required) {
        throw new Error(
          `Insufficient ${field}: ${item.material_name || item.tool_name}`
        );
      }
      item.amount_available -= resource.amount_required;
      await item.save();
    }
  };
  
  const incrementResourceCount = async (resources, model, field) => {
    for (const resource of resources) {
      const item = await model.findById(resource._id);
      if (item) {
        item.amount_available += resource.amount_required;
        await item.save();
      }
    }
  };
  