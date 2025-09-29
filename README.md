# Quiz Maker

## Quick Start

```
# Install all dependencies (web & api)
pnpm i

# Run local server (web & api)
pnpm dev
```

That's it! Ready to Start?

# MVP

## Quiz Builder

- Quiz Builder can create a quiz
- Quiz Builder can create a question attached to quiz created
- Summary of the quiz and questions at the end of the page
- NOTE: `code` answer is submitted but it was not recorded in API

## Quiz Player

- Player can search a quiz by ID
- Added a listing of Quizzes (for testing purposes)
- Player can see the overall score and summary at the end of the quiz
- Save Player exam attempt via `/attempts` endpoint
  - NOTE: Initially, this was not submitted to API as it was not clear on the requirements if this needs to be saved to the API,

## Anti Cheat

- Logs the # of times switch tabs and paste events and their timestamp when the user started the quiz
- Send Record in `/attemps/{recordId}/events`
  - NOTE: Initially, this was not submitted to API as it was not clear on the requirements if this needs to be saved to the API

# For Improvement

Can be added based on the available API endpoints/data

## Quiz Builder

- Update Quiz title and description
- Add quiz timer (with: `Quiz.timeLimitSeconds`)
- Sort questions (with: `Question.position`)
- Delete Question

---

# Tech Stack

- Framework:
  - NextJS
- Styling:
  - TailwindCSS
  - Material UI (I am familiar with tailwindCSS but I also wanted to explore MaterialUI so I added this on my styling library)
- Backend Connection:
  - Tanstack query
  - axios (I know fetch is lighter for this simple app but I use axios for a more simple response handling)
- Package Manager
  - pnpm (I've been using pnpm for faster installation and for monorepo support)
