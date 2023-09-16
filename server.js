const express = require("express");
const bodyParser = require("body-parser");
const { Web3 } = require("web3");
const ABI = require("./ABI.json");
const { SpheronClient, ProtocolEnum } = require("@spheron/storage");
const dotenv = require("dotenv");
const upload = require("./multer");
const fs = require('fs')
const path = require('path')

const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// keep the key secret as it can be paid
const web3 = new Web3(
  "https://lingering-tiniest-meadow.ethereum-sepolia.discover.quiknode.pro/612b4f1fdecd98605e21eb212c3a1a2f9c4c7496/"
);
const contractAddress = "0x54bdf659cC2925f87729d2EA7C03d66db7d5934C";

dotenv.config();
const client = new SpheronClient({ token: process.env.TOKEN });

const PORT = 5000;

// contract address'

const contract = new web3.eth.Contract(ABI, contractAddress);
// console.log(contract.methods);
/**
 *
 */

const FetchNFT = async (account) => {
  try {
    const nftBalance = await contract.methods.balanceOf(account).call();
    return nftBalance;
  } catch (error) {
    console.log(error);
  }
};




// This api end point will upload out file imag path to ipfs (Spheron Storage ) and return the ipfs uploaded url
app.get("/api/upload", async (req, res) => {
  const name = "my-bucket";
  const folderPath = "uploads"; // Replace with your folder path

  // Read the files in the folder
  fs.readdir(folderPath, async(err, files) => {
    if (err) {
      console.error("Error reading folder:", err);
      return res.status(500).json({ error: "Error reading folder" });
    }

    // Check if there are any files in the folder
    if (files.length === 0) {
      console.error("No files found in folder");
      return res.status(400).json({ error: "No files found in folder" });
    }

    // Select the first file in the folder
    const fileName = files[files.length-1];
    const filePath = path.join(folderPath, fileName);
    console.log(files)

    try {
      const { uploadId, bucketId, protocolLink, dynamicLinks, cid } =
        await client.upload(filePath, {
          protocol: ProtocolEnum.IPFS,
          name,
          onUploadInitiated: (uploadId) => {
            console.log(`Upload with id ${uploadId} started...`);
          },
          onChunkUploaded: (uploadedSize, totalSize) => {
            console.log(`Uploaded ${uploadedSize} of ${totalSize} Bytes.`);
          },
        });

      // You can send a response to the frontend indicating success
      if (cid) {
        const fileData = fs.readFileSync(filePath);
        res.status(200).json({
          message: "Upload completed",
          cid: cid,
          fileName ,
          url:`https://${cid}.ipfs.sphn.link/${fileName}`
          // Send the file as base64 encoded data
          // Other response properties if needed
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      // Send an error response to the frontend
      res.status(500).json({ error: "Error uploading file" });
    }
  });
});

// this api end point is to get the NFT count of a user having public address

app.post("/api/members", async (req, res) => {
  try {
    const account = req.body.from;
    console.log("this is account", account);

    const numNFTs = await FetchNFT(account);
    const nfts = Number(numNFTs);
    console.log(nfts);

    // if (nfts > 0) {
    //   res.status(200).json({ status: 200, nfts });
    // } else {
    //   res.status(400).json({ status: 400, nfts });
    // }
    res.status(200).send({nfts})
    // console.log( typeof numNFTs)
    // res.status(200).send(numNFTs.toString())
  } catch (error) {
    // res.sendStatus(500);
    // res.json({"error": error});
    res.status(500).json({ error: error });
    console.error(error);
  }
});

// multer use case
app.post("/upload/file", upload.single("file"), async (req, res) => {
  console.log("file:", req.files, " & ", req.file);
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    res.json({
      message: "File uploaded successfully",
      fileName: file.filename,
    });
  } catch (error) { 
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

app.get("/good", (req, res) => {
  console.log("ehloo");
});


// New route to handle JSON data
app.post('/upload/json', (req, res) => {
  try {
    const { image, name, description } = req.body;

    // if (!image || !name || !description) {
    //   return res.status(400).json({ message: 'Incomplete data provided' });
    // }
    console.log(image, name, description);

    const jsonData = {
      image,
      name,
      description,
      
    };

    // Define the path to the local JSON file where you want to store the data
    const filePath = 'data.json';

    // Convert JSON data to a string
    const jsonString = JSON.stringify(jsonData);

    // Write the JSON data to the local file
    fs.writeFileSync(filePath, jsonString);

    res.json({
      message: 'JSON data saved successfully',
    });
  } catch (error) {
    console.error('Error saving JSON data:', error);
    res.status(500).json({ message: 'Error saving JSON data' });
  }
});

// api endpoint for the json file upload on Spheron 
app.get("/api/upload/json", async (req, res) => {
  const name = "my-bucket";
  const fileName = "data.json"; // Specify the name of the JSON file
  const filePath = path.join(__dirname, fileName); // Construct the full path to the JSON file

  try {
    // Check if the JSON file exists
    if (!fs.existsSync(filePath)) {
      console.error("JSON file does not exist");
      return res.status(400).json({ error: "JSON file does not exist" });
    }

    const { uploadId, bucketId, protocolLink, dynamicLinks, cid } =
      await client.upload(filePath, {
        protocol: ProtocolEnum.IPFS,
        name,
        onUploadInitiated: (uploadId) => {
          console.log(`Upload with id ${uploadId} started...`);
        },
        onChunkUploaded: (uploadedSize, totalSize) => {
          console.log(`Uploaded ${uploadedSize} of ${totalSize} Bytes.`);
        },
      });

    // You can send a response to the frontend indicating success
    if (cid) {
      const fileData = fs.readFileSync(filePath);
      res.status(200).json({
        message: "Upload completed",
        cid: cid,
        fileName: fileName,
        url: `ipfs://${cid}/${fileName}`,
        // Send the file as base64 encoded data
        // Other response properties if needed
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    // Send an error response to the frontend
    res.status(500).json({ error: "Error uploading file" });
  }
});






app.listen(PORT, () => {
  console.log(`Server listining to ${PORT}`);
});
