const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;

const STUDENTS_DATA_FILE = path.join(__dirname, "StudentsData.json");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "insert-student.html"));
});

app.get("/show-students", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "show-students.html"));
});

function removeBOM(data) {
  if (data.charCodeAt(0) === 0xfeff) {
    return data.slice(1);
  }
  return data;
}

async function readJSONFile() {
  try {
    let data = await fs.readFile(STUDENTS_DATA_FILE, "utf8");
    data = removeBOM(data);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("File does not exist, starting with an empty array");
      return [];
    } else {
      throw error;
    }
  }
}

async function writeJSONFile(data) {
  await fs.writeFile(STUDENTS_DATA_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/students", async (req, res) => {
  const newStudent = req.body;
  try {
    let students = await readJSONFile();

    students.push(newStudent);
    await writeJSONFile(students);

    res.status(201).send("Student added successfully");
  } catch (error) {
    res.status(500).send(`Error processing student data: ${error.message}`);
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await readJSONFile();
    res.json(students);
  } catch (error) {
    res.status(500).send("Error fetching student data");
  }
});

app.get("/api/students/search", async (req, res) => {
  try {
    const students = await readJSONFile();
    const searchBy = Object.keys(req.query)[0];
    const searchValue = req.query[searchBy];
    const student = students.find(
      (s) => s[searchBy].toLowerCase() === searchValue.toLowerCase()
    );
    if (student) {
      res.json(student);
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.put("/api/students/:sid", async (req, res) => {
  try {
    const students = await readJSONFile();
    const index = students.findIndex((s) => s.sid === req.params.sid);
    if (index !== -1) {
      if (!req.body.subjects || req.body.subjects.length === 0) {
        req.body.subjects = students[index].subjects;
      }
      students[index] = req.body;
      await writeJSONFile(students);
      res.send("Student updated successfully");
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.delete("/api/students/:sid", async (req, res) => {
  try {
    let students = await readJSONFile();
    const initialLength = students.length;
    students = students.filter((s) => s.sid !== req.params.sid);
    if (students.length < initialLength) {
      await writeJSONFile(students);
      res.send("Student deleted successfully");
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
