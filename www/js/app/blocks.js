var app = angular.module("QueGui");

app.controller("BlockController", function($scope, $rootScope, blockService) {
  var root = this;
  this.blocks = [];

  // block information stored here
  // for new block
  this.newBlock = {
    name: "",
    desc: "",
    tags: []
  }

  // fetch all the blocks
  this.fetchBlocks = function() {
    blockService.getAllBlocks(function(blocks) {
      root.blocks = blocks;

      // create devcode (join code together so it can be edited)
      _.each(blocks, function(block) {
        block.devCode = block.code.join("\n");

        // also, create space for logs
        block.log = [];
      });
    });
  }
  this.fetchBlocks();

  // async event handler
  $rootScope.$on('updateBlocks', function(event) {
    root.fetchBlocks();
  });

  // add a new block
  this.addBlock = function() {

    // make sure tags are formatted correctly tags
    if (this.newBlock.tags && this.newBlock.tags.length === undefined) {
      this.newBlock.tags = this.newBlock.tags.split(" ");
    }

    // add block
    blockService.addBlock(this.newBlock, function() {
      // clear block cache
      blockService.cache = {};

      // refetch blocks
      root.fetchBlocks();
    });

    // reset the new block form
    this.newBlock = {
      name: "",
      desc: "",
      tags: []
    }
  }

  // delete an old block
  this.deleteBlock = function(block) {

    blockService.removeBlock(block.id, function() {
      // clear cache
      blockService.cache = {};

      // refetch blocks
      root.fetchBlocks();
    });

  }

  // update the code back on the server inside
  // the block
  this.updateBlock = function(block) {
    // split up code into its transmitable form
    block.code = block.devCode.split("\n");
    delete block.log;

    // send it on its way
    b = angular.fromJson(angular.toJson(block)); // strip out all the angular crap
    blockService.updateBlockData(block.id, b, function(e){
      block.log = [];
    });
  }

  // format the log (to display better)
  this.formatLogs = function(block) {
    return block.log && block.log.length ? "> " + block.log.join("\n> ") : "";
  }

  // disable a block
  this.setBlockDisabled = function(block, state) {
    block.disable = state || !block.disable;
    this.updateBlock(block);
  }

  // update block log
  socket.on('block-log', function(blk) {

    // get the correct id
    b = _.filter(root.blocks, function(item) {
      return item.id == blk.id;
    });

    // append to the log, and update the view
    if (b.length && b[0].log) {
      // convert date
      blk.when = typeof blk.when == "string" ? new Date(blk.when) : blk.when;

      // add it to the block view
      // console.log(blk);
      if (b[0].log.indexOf(blk) === -1) {
        b[0].log.unshift(blk);
      };

      // update angular
      $scope.$apply();
    };
  });

  // the backend has new data for us
  socket.on('backend-data-change', function(payload) {
    if (payload && payload.type === "block") {
      console.log('B', payload)

      // update the payload data
      root.blocks = mergeDataStructures(root.blocks, payload.data);
      console.log(root.blocks)

      // clear block logs
      root.blocks.forEach(function(b) {
        b.log = [];
      })

      // update scope
      $scope.$apply();
    };
  });
});
