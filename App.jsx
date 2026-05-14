import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCoCZi3CSyR3p7qrS27BI8zhna-cSfhFE",
  authDomain: "the-writing-archive.firebaseapp.com",
  projectId: "the-writing-archive",
  storageBucket: "the-writing-archive.firebasestorage.app",
  messagingSenderId: "1008759324146",
  appId: "1:1008759324146:web:aa7735b16d7ffd20073f6b",
  measurementId: "G-DTZWHK14E1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const piecesRef = useRef(null);
  const submitRef = useRef(null);

  const [pieces, setPieces] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", body: "" });
  const [commentForms, setCommentForms] = useState({});
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const q = query(collection(db, "pieces"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPieces = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      setPieces(loadedPieces);
    });

    return () => unsubscribe();
  }, []);

  function scrollToSubmit() {
    submitRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToPieces() {
    piecesRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function publishPiece() {
    if (!form.title.trim() || !form.body.trim()) {
      setStatus("Please add a title and writing before publishing.");
      return;
    }

    try {
      await addDoc(collection(db, "pieces"), {
        title: form.title.trim(),
        author: form.author.trim() || "Anonymous",
        body: form.body.trim(),
        comments: [],
        createdAt: serverTimestamp()
      });

      setForm({ title: "", author: "", body: "" });
      setStatus("Your piece has been added to the archive.");
      setTimeout(scrollToPieces, 200);
    } catch (error) {
      setStatus("Something went wrong while publishing. Try again.");
      console.error(error);
    }
  }

  async function addComment(pieceId) {
    const comment = commentForms[pieceId];

    if (!comment?.name?.trim() || !comment?.note?.trim()) {
      return;
    }

    try {
      await updateDoc(doc(db, "pieces", pieceId), {
        comments: arrayUnion({
          name: comment.name.trim(),
          note: comment.note.trim(),
          createdAt: new Date().toISOString()
        })
      });

      setCommentForms({
        ...commentForms,
        [pieceId]: { name: "", note: "" }
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function deletePiece(pieceId) {
    const confirmDelete = window.confirm("Delete this piece from the archive?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "pieces", pieceId));
    } catch (error) {
      console.error(error);
    }
  }

  function unlockCreatorMode() {
    const password = prompt("Enter creator password:");

    if (password === "aplang") {
      setIsCreatorMode(true);
    } else if (password !== null) {
      alert("Incorrect password.");
    }
  }

  return (
    <div className="site">
      <header className="hero">
        <div className="container">
          <p className="eyebrow">AP Language & Composition</p>
          <h1>The Writing Archive</h1>
          <p className="heroText">
            A quiet little corner for our class to share writing, leave kind
            notes, and preserve the pieces that mattered to us this year.
          </p>
        </div>
      </header>

      <section className="intro container">
        <div>
          <h2>Share something honest.</h2>
          <p>
            Essays. Fragments. Poetry. Midnight thoughts. Pieces you never
            expected people to connect with.
          </p>

          <div className="buttonRow">
            <button className="primaryButton" onClick={scrollToSubmit}>
              Submit Writing
            </button>
            <button className="secondaryButton" onClick={scrollToPieces}>
              Read Pieces
            </button>
          </div>
        </div>

        <div className="featuredNote">
          <p className="noteLabel">Featured Note</p>
          <p className="noteQuote">“Your writing makes people feel less alone.”</p>
          <p className="noteSignature">— AP Lang Classmate</p>
        </div>
      </section>

      <section ref={piecesRef} className="container piecesSection">
        <div className="sectionHeader">
          <div>
            <h2>Class Pieces</h2>
            <p>Once people submit, their writing will appear here.</p>
          </div>

          {isCreatorMode ? (
            <p className="creatorText">Creator mode is on.</p>
          ) : (
            <button className="tinyButton" onClick={unlockCreatorMode}>
              Creator Mode
            </button>
          )}
        </div>

        {pieces.length === 0 ? (
          <div className="emptyState">
            <h3>No pieces yet.</h3>
            <p>
              When someone submits writing, it will show up here as a cozy card
              with space for kind notes underneath.
            </p>
            <button className="darkButton" onClick={scrollToSubmit}>
              Be the first to submit
            </button>
          </div>
        ) : (
          <div className="pieceGrid">
            {pieces.map((piece) => (
              <article className="pieceCard" key={piece.id}>
                <div className="pieceTop">
                  <div>
                    <h3>{piece.title}</h3>
                    <p className="author">by {piece.author}</p>
                  </div>

                  {isCreatorMode && (
                    <button
                      className="deleteButton"
                      onClick={() => deletePiece(piece.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p className="pieceBody">{piece.body}</p>

                <div className="kindNotes">
                  <p className="noteLabel">Kind Notes</p>

                  {!piece.comments || piece.comments.length === 0 ? (
                    <p className="noNotes">No notes yet. Leave the first one.</p>
                  ) : (
                    <div className="commentList">
                      {piece.comments.map((comment, index) => (
                        <div className="comment" key={index}>
                          <p className="commentName">{comment.name}</p>
                          <p>“{comment.note}”</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="commentForm">
                  <input
                    value={commentForms[piece.id]?.name || ""}
                    onChange={(e) =>
                      setCommentForms({
                        ...commentForms,
                        [piece.id]: {
                          ...commentForms[piece.id],
                          name: e.target.value
                        }
                      })
                    }
                    placeholder="Your name"
                  />

                  <textarea
                    value={commentForms[piece.id]?.note || ""}
                    onChange={(e) =>
                      setCommentForms({
                        ...commentForms,
                        [piece.id]: {
                          ...commentForms[piece.id],
                          note: e.target.value
                        }
                      })
                    }
                    rows={3}
                    placeholder="Leave a kind note..."
                  />

                  <button
                    className="primaryButton small"
                    onClick={() => addComment(piece.id)}
                  >
                    Add Note
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section ref={submitRef} className="container submitSection">
        <div className="submitCard">
          <h2>Submit Your Writing</h2>

          <div className="formGrid">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
            />

            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Your name or leave blank for Anonymous"
            />

            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder="Paste your writing here..."
            />

            <button className="darkButton" onClick={publishPiece}>
              Publish Piece
            </button>

            {status && <p className="status">{status}</p>}
          </div>
        </div>
      </section>

      <footer>
        <p>“Some words stay with people long after the page ends.”</p>
      </footer>
    </div>
  );
}
