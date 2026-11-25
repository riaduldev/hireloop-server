import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb';
import 'dotenv/config'
import { ObjectId } from "mongodb";


const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const client = new MongoClient(process.env.MONGO_DB_URI);


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();
const database = connectedClient.db("hireloopdb");
const users = database.collection('user')
const jobs = database.collection("jobs")

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/users" , async(req, res) => {
    const cursor = users.find({});
    const result = await cursor.toArray();
    res.send(result)
})

// job related api 
app.get('/jobs', async(req, res) => {
    const cursor = jobs.find({});
    const result = await cursor.toArray();
    res.send(result)
})

app.post('/jobs', async(req, res) => {
 const job = req.body;
 const result = await jobs.insertOne(job);
 res.send(result)
})

app.delete("/jobs/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid job ID",
      });
    }

    const result = await jobs.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Job not found",
      });
    }

    res.send({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    res.status(500).send({
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid job ID",
      });
    }

    const job = await jobs.findOne({
      _id: new ObjectId(id),
    });

    if (!job) {
      return res.status(404).send({
        message: "Job not found",
      });
    }

    res.send(job);
  } catch (error) {
    res.status(500).send({
      message: "Failed to get job details",
    });
  }
});


// Update job
app.patch("/jobs/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const jobData = req.body;

    // Check valid job ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid job ID",
      });
    }

    // Check job exists
    const existingJob = await jobs.findOne({
      _id: new ObjectId(id),
    });

    if (!existingJob) {
      return res.status(404).send({
        success: false,
        message: "Job not found",
      });
    }

    // Allowed fields to update
    const allowedFields = [
      "title",
      "companyName",
      "category",
      "jobType",
      "remoteAllowed",
      "location",
      "description",
      "salary",
      "deadline",
    ];

    // Prepare updated data
    const updatedData = {};

    allowedFields.forEach((field) => {
      if (jobData[field] !== undefined) {
        updatedData[field] = jobData[field];
      }
    });

    // Update job in MongoDB
    const result = await jobs.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          ...updatedData,
          updatedAt: new Date(),
        },
      }
    );

    res.send({
      success: true,
      message: "Job updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Update job error:", error);

    res.status(500).send({
      success: false,
      message: "Failed to update job",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})