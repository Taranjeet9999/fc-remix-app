

  function packItems(_bins, _items, level = 0) {
    logger.info(typeof Packer);
     
      let packer = new Packer();
      let bin_itemsto_send = [];
    
      let bins = _bins.map(
        (bin) =>
          new Bin(
            `${bin?.name ?? "Box"}-${level}`,
            bin.width,
            bin.height,
            bin.length,
            1000000000000
          )
      );
      let items = _items.map(
        (item) =>
          new Item(item.name, item.width, item.height, item.length, item.weight)
      );
      bins.forEach((bin) => packer.addBin(bin));
      items.forEach((item) => packer.addItem(item));
      packer.pack();
      let packedItems = bins.map((bin) => ({
        ...bin,
        length: bin.depth,
        sub_packs: bin.items,
      }));
    
      packedItems.forEach((bin) => {
        if (bin.sub_packs.length > 0) {
          bin_itemsto_send.push(bin);
        }
      });
      if (packer.unfitItems.length > 0) { 
        let updatedItems = packer.unfitItems.map((item) => ({
          ...item,
          width: item.height / 100000,
          height: item.width / 100000,
          length: item.depth / 100000,
          weight: item.weight / 100000,
        }));
        let newItems = packItems(_bins, updatedItems, level + 1);
        bin_itemsto_send = bin_itemsto_send.concat(newItems);
      }
    
      return bin_itemsto_send;
    }