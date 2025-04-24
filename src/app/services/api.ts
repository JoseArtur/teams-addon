const API_URL = "https://teams-be.azurewebsites.net/api";
//const API_URL = "http://localhost:7071/api";

export interface Book {
  title: string;
  pagesRead: number;
  completedOn?: string;
  timestamp?: string;
  pointsEarned: number;
}

export interface Student {
  id: string;
  name: string;
  booksRead: Book[];
}

export interface CheckStudentResponse {
  exists: boolean;
}
export interface GetStudentInfoResponse {
  id: string;
  email: string;
  name: string;
  grade: string;
  turma: string;
  booksRead: string[];

  currentlyReading: string[];
  createdAt: string;
  // Add other fields as needed
}
// Generic function to send POST requests
const isDev = true

const baseHeaders = {
  "Content-Type": "application/json",
  ...(isDev && { "ngrok-skip-browser-warning": "69420" }),
};

export async function postData(functionName: string, data: any) {
  const response = await fetch(`${API_URL}/${functionName}`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getData(functionName: string, params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/${functionName}?${queryString}`, {
    headers: baseHeaders,
  });
  return response.json();
}
// Specific API calls
export function createClass(className: string, teacherId: string, teacherName: string) {
  return postData("createClass", { name: className, teacherId, teacherName });
}

export function addTeacher(classId: string, teacherId: string, teacherName: string) {
  return postData("addTeacher", { classId, teacherId, teacherName });
}

export function addStudent(classId: string, email: string) {
  return postData("addStudentToClass", { classId, email });
}

export function assignBook(classId: string, bookId: string, dueDate: string, points: number) {
  return postData("assignBookToClass", { classId, bookId, dueDate, points });
}

export function logReading(classId: string, email: string, bookId: string, status?: string, rating?: number, notes?: string) {
  return postData("logReading", { classId, email, bookId, status, rating, notes });
}

export function getClassData(classId: string) {
  return postData("getClassDashboard", { classId });
}

export function getLeaderboard(classId: string) {
  return getData("getLeaderboard", { classId });
}

export function getStudentHistory(email: string) {
  return getData("getStudentHistory", { email });
}

export function addCurricularBook(bookData: any) {
  return postData("addCurricularBook", bookData);
}


export async function checkIfStudentExists(identifier: string, isTeacher = false): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/checkUser?email=${identifier}&isTeacher=${isTeacher}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(isDev && { "ngrok-skip-browser-warning": "69420" }),
        },
      }
    );

    if (res.headers.get("Content-Type")?.includes("application/json")) {
      const data = await res.json();
      console.log("Response from checkIfStudentExists:", data);
      return data.exists;
    } else {
      console.error("Unexpected response format:", await res.text());
      return false;
    }
  } catch (err) {
    console.error("Erro ao verificar usuário:", err);
    return false;
  }
}

export async function getCurricularBooksByGrade(grade: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/getCurricularBooksByGrade?ano=${grade}`);
    
    // Check if the response is OK
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Data fetched from API:", data);

    // Ensure the result is a valid array of books
    if (Array.isArray(data.books)) {
      return data.books;
    } else {
      console.error("Unexpected response format:", data);
      return [];
    }
  } catch (err) {
    console.error("Erro ao buscar livros curriculares:", err);
    return [];
  }
}

export async function registerStudentAndBooks({  email, grade, books }: {
  email: string;
  grade: string;
  books: string[];
}): Promise<void> {
  try {
    await fetch(`${API_URL}/registerStudentAndBooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, grade, books }),
    });
  } catch (err) {
    console.error("Erro ao registrar aluno:", err);
  }
}

/**
 * Logs the reading progress of a student.
 * @param email - The ID of the student.
 * @param bookId - The ID of the book.
 * @param pageNumber - The current page number the student has read.
 * @param status - Optional status of the reading progress ("reading" or "finished").
 * @param notes - Optional notes about the reading progress.
 */
export async function registerReadingProgress(
  email: string,
  bookId: string,
  pageNumber: number,
  status?: string,
  notes?: string
): Promise<void> {
  try {
    console.log("Registering reading progress:", {
      email,
      bookId,
      pageNumber,
      status,
      notes,
    });
    const response = await fetch(`${API_URL}/registerReadingProgress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        bookId,
        pageNumber,
        status,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register reading progress: ${response.statusText}`);
    }

    console.log("Reading progress registered successfully.");
  } catch (error) {
    console.error("Error registering reading progress:", error);
    throw error;
  }
}


/**
 * Fetches the books associated with a student.
 * @param email - The ID of the student.
 * @returns A promise resolving to the student's books categorized by status.
 */
export async function getStudentBooks(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentsBooks?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching student books:", error);
    throw error;
  }
}

export async function getStudentInfo(email: string): Promise<GetStudentInfoResponse> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentInfo?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student info: ${response.statusText}`);
    }
    return response.json();
  }
catch (error) {
  console.error("Error fetching student info:", error);
  throw error;
}
}
export async function getBookById(bookId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/getBookById?bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch book: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching book:", error);
    throw error;
  }
}
export async function getCurrentPageByBookId(email: string, bookId: string): Promise<number> {
  try {
    
    console.log("Fetching current page for student:", email, "and book:", bookId);
    const response = await fetch(`${API_URL}/getCurrentPageByBookId?email=${email}&bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch current page: ${response.statusText}`);
    }
    const data = await response.json();
    // Supondo que o backend retorna { currentPage: 42 }
    return data.currentPage || 0;
  } catch (error) {
    console.error("Error fetching current page:", error);
    throw error;
  }
}
export async function getStudentRanking(email: string): Promise<any> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentRanking?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student ranking: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching student ranking:", error);
    throw error;
  }
}
export async function getQuiz(bookId: string, capitulo: number) {
  try {
    const response = await fetch(`${API_URL}/getQuiz?bookId=${bookId}&capitulo=${capitulo}`);
   
    if (response.status === 404) {
      // Não existe quiz para esse capítulo, retorna vazio
      return { perguntas: [] };
    } if (!response.ok) {
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
}
export async function getAllQuizByBookId(bookId: string) {
  try {
    const response = await fetch(`${API_URL}/getAllQuizByBookId?bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all quizzes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    throw error;
  }
}
export async function submitQuizAnswers({ email, bookId, capitulo, respostas }: {
  email: string;
  bookId: string;
  capitulo: number;
  respostas: string[];
}): Promise<any> { // <-- Altere para Promise<any>
  try {
    const response = await fetch(`${API_URL}/submitQuizAnswers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, bookId, capitulo, respostas }),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit quiz answers: ${response.statusText}`);
    }
    return await response.json(); // <-- Retorne o JSON do backend
  } catch (error) {
    console.error("Error submitting quiz answers:", error);
    throw error;
  }
}

export async function getAnsweredQuizzes(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getAnsweredQuizzes?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch answered quizzes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching answered quizzes:", error);
    throw error;
  }
}

export async function addPointsToUser(email: string, tipo: string, valor: number, detalhes?: string) {
  const response = await fetch(`${API_URL}/addPointsToUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tipo, valor, detalhes }),
  });
  if (!response.ok) throw new Error("Erro ao adicionar pontos");
  return response.json();
}

// Retorna total e histórico de pontos do usuário
export async function getPoints(email: string) {
  

  const response = await fetch(`${API_URL}/getPoints?email=${email}`);
  if (!response.ok) throw new Error("Erro ao buscar pontos");
  return response.json();
}

// Cria um novo desafio
export async function createDesafio(desafio: any) {
  const response = await fetch(`${API_URL}/createDesafio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(desafio),
  });
  if (!response.ok) throw new Error("Erro ao criar desafio");
  return response.json();
}

// Retorna desafios ativos da turma
export async function getDesafios(grade: string, turma: string) {
  const response = await fetch(`${API_URL}/getDesafios?grade=${grade}&turma=${turma}`);
  if (!response.ok) throw new Error("Erro ao buscar desafios");
  return response.json();
}

// Marca desafio como concluído e adiciona pontos
export async function completeDesafio(email: string, desafioId: string) {
  const response = await fetch(`${API_URL}/completeDesafio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, desafioId }),
  });
  if (!response.ok) throw new Error("Erro ao completar desafio");
  return response.json();
}

export async function getCompletedDesafios(email: string) {
  

  const response = await fetch(`${API_URL}/getCompletedDesafios?email=${email}`);
  if (!response.ok) throw new Error("Erro ao buscar desafios completos");
  return response.json();
}

export async function searchBooks(query: string) {
  const q = `subject:juvenile ${query}`;
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&langRestrict=pt&maxResults=10`
  );
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    title: item.volumeInfo.title,
    author: item.volumeInfo.authors?.[0] || "Autor desconhecido",
    description: item.volumeInfo.description || "",
    thumbnail: item.volumeInfo.imageLinks?.thumbnail,
  }));
}

export async function addBookToShelf(email: string, book: any) {
  console.log("Adicionando livro à estante:", book);
  const response = await fetch(`${API_URL}/addBookToShelf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, book }),
  });
  if (!response.ok) throw new Error("Erro ao adicionar livro à estante");
  return response.json();
}

export async function getPersonalBooks(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getPersonalBooks?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch personal books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching personal books:", error);
    throw error;
  }
}
export async function getCurricularBooks(grade: string): Promise<any[]> {
  try {

    
    const response = await fetch(`${API_URL}/getCurricularBooks?grade=${grade}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch curricular books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching curricular books:", error);
    throw error;
  }
}
export async function searchBooksApi(query: string, grade: string

): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/searchBooks?query=${encodeURIComponent(query)}&grade=${encodeURIComponent(grade)}`);
    if (!response.ok) {
      throw new Error(`Failed to search books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error searching books:", error);
    throw error;
  }
}
export async function getStudentStatsToday(email: string) {
  const response = await fetch(`${API_URL}/getStudentStatsToday?email=${encodeURIComponent(email)}`);
  console.log("Response from getStudentStatsToday:", response);
  if (!response.ok) throw new Error("Erro ao buscar estatísticas do aluno");
  return response.json();
}

//import { getClasses, getClassStudents, getBooks, getStudentBookProgress } from "../services/api"; // <-- Adicione suas APIs reais aqui

// 1. Busca turmas do professor
export async function getClasses(email: string) {
  const response = await fetch(`${API_URL}/getClasses?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar turmas");
  return response.json();
}

// 2. Busca alunos de uma turma (grade e turma)
export async function getClassStudents(grade: string, turma: string) {
  const response = await fetch(`${API_URL}/getClassStudents?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}`);
  if (!response.ok) throw new Error("Erro ao buscar alunos da turma");
  return response.json();
}

// 3. Busca livros por ano (grade)
export async function getBooks(ano: string) {
  const response = await fetch(`${API_URL}/getBooks?ano=${encodeURIComponent(ano)}`);
  if (!response.ok) throw new Error("Erro ao buscar livros do ano");
  return response.json();
}

// 4. Progresso do aluno em um livro
export async function getStudentBookProgress(email: string, bookId: string) {
  const response = await fetch(`${API_URL}/getStudentBookProgress?email=${encodeURIComponent(email)}&bookId=${encodeURIComponent(bookId)}`);
  if (!response.ok) throw new Error("Erro ao buscar progresso do aluno no livro");
  return response.json();
}

// 5. Progresso de todos os alunos da turma em um livro
export async function getStudentBookProgressByClass(grade: string, turma: string, bookId: string) {
  const response = await fetch(`${API_URL}/getStudentBookProgressByClass?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}&bookId=${encodeURIComponent(bookId)}`);
  if (!response.ok) throw new Error("Erro ao buscar progresso dos alunos no livro");
  return response.json();
}

// getStudentLogs
export async function getStudentLogs(email: string) {
  const response = await fetch(`${API_URL}/getStudentLogs?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar logs do aluno");
  return response.json();
}
// getStudentQuizzes
export async function getStudentQuizzes(email: string) {
  const response = await fetch(`${API_URL}/getStudentQuizzes?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar quizzes do aluno");
  return response.json();
}
export async function removeQuiz(quizId: string): Promise<void> {
  // Add the implementation for removing a quiz
}
export async function removeDesafio(desafioId: string): Promise<void> {
  // Add the implementation for removing a desafio
}

export async function updateQuiz(quiz: {
  id: string;
  perguntas: any[];
  capitulo: number;
  livroId: string;
  bookId: string;
  ciclo: string;
  grade: string;
}) {
  const response = await fetch(`${API_URL}/updateQuiz`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quiz),
  });
  if (!response.ok) throw new Error("Erro ao atualizar quiz");
  return response.json();
}

export async function getBadgeInfo(id: string) {
  const response = await fetch(`${API_URL}/getBadgeInfo?id=${id}`);
  if (!response.ok) throw new Error("Erro ao buscar informações do badge");
  return response.json();
}