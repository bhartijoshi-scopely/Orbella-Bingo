def get_prompt(theme: str) -> str:
    base = (
        """Create a soft, subtle 3D animated looping background video designed for a casual Bingo game UI.\n"
        "This background must appeal to a mature casual-gaming audience (ages 40–45), so avoid intense\n"
        "motion, fast effects, or overly bright colors. Keep everything calm, warm, and comfortable.\n\n"
        "--- THEME ---\n"
        "Apply the user-given theme: {THEME}\n"
        "Interpret it softly and tastefully in a cozy, friendly, whimsical mobile-game art style.\n\n"
        "--- LOOPING REQUIREMENT (CRITICAL) ---\n"
        "The first frame and last frame must be *identical* for a perfect infinite loop.\n"
        "Use a cyclic camera motion such as a slight circular pan or gentle sway that returns\n"
        "exactly to its starting position. No linear drifting, no perspective changes that\n"
        "cannot loop cleanly.\n\n"
        "--- MOTION REQUIREMENTS (VERY SUBTLE) ---\n"
        "• Only minimal motion: gentle cloud drift, faint shimmer, soft particles, or slow ambient lighting.\n"
        "• Avoid busy animation; keep motion almost unnoticeable but alive.\n"
        "• All moving elements must follow cyclic paths so they return to the initial state.\n\n"
        "--- 3D ENVIRONMENT REQUIREMENTS ---\n"
        "• Build a full 3D world with depth, but keep it soft and easy on the eyes.\n"
        "• Keep the center area simple and unobtrusive for UI placement.\n"
        "• Place more detail in the horizon and side regions.\n"
        "• Maintain a pastel, painterly art style similar to casual mobile puzzle games.\n"
        "• No characters, text, or UI props.\n\n"
        "--- AUDIENCE TONE ---\n"
        "• Calm, nostalgic, light-hearted.\n"
        "• No harsh contrast, no fast-moving particles, no dramatic lighting.\n"
        "• Should feel welcoming and relaxing, not flashy or ‘kid-like.’\n\n"
        "--- OUTPUT GOAL ---\n"
        "Produce a high-quality 3D animated looping background video (1080p or 4K) with\n"
        "minimal motion, perfect loop (first = last frame), themed to {THEME}, suitable for\n+        "a mature casual Bingo audience."""
    )
    return base.replace("{THEME}", theme or "")


def get_card_prompt(theme: str) -> str:
    """Build the detailed bingo-board prompt, injecting the user theme."""
    base = (
            """2d mobile game UI asset, bingo board game container, {theme} theme.
            
    TEXT AND HEADER:
    Top header row MUST display the text "BINGO" clearly. 
    Five distinct header squares, one letter per square: "B", "I", "N", "G", "O".
    Bold, capitalized typography integrated into the {theme} frame.

    GRID STRUCTURE (MANDATORY):
    Strict 5x5 matrix grid. Exactly 5 columns and 5 rows. 
    Total of 25 empty white rounded-square slots in the main body.
    Perfectly aligned geometric grid, equal spacing, symmetric layout.

    VISUAL STYLE:
    {theme} inspired thick border frame. 
    Glossy vector art style, clean vector lines, smooth shading, distinct soft beveled edges.
    Plastic-like sheen, high saturation, professional game art, Unity engine asset.

    VIEW:
    Direct front-facing, flat orthographic view, 90-degree angle, no perspective distortion, no rotation.

    BACKGROUND:
    Solid #00FF00 bright green chroma key background. 
    No shadows, no gradients, no patterns on the background. Flat color only."""
        )
    return base.replace("{theme}", theme or "classic")


def get_ball_caller_prompt(theme: str) -> str:
    """Build the detailed ball caller display panel prompt, injecting the user theme."""
    base = (
        """2d mobile game UI HUD element, ball caller display dashboard, {theme} theme.

VISUAL STRUCTURE (CRITICAL):
A thick, heavy, horizontal rectangular panel with rounded corners.
The panel contains 5 MASSIVE, OVERSIZED, COMPLETELY EMPTY circular glass sockets arranged horizontally.
The circles should be maximized in size, nearly touching the top and bottom edges of the frame (minimal padding).
Deep vertical height to the container to accommodate the large circles.
IMPORTANT: The inside of the circular sockets must be 100% blank and void. No text, no numbers, no letters, no words, no "BINGO" label inside the circles.

STYLE & TEXTURE:
{theme} inspired heavy frame, reinforced borders.
Glossy vector art style, smooth shading, distinct soft beveled edges, plastic-like sheen.
The circular slots should look like deep glass receptacles.
High saturation colors themed to {theme}, clean lines, professional mobile game art.

VIEW:
Front-facing, flat orthographic view, direct 90-degree angle, no perspective distortion.

BACKGROUND:
Solid #00FF00 bright green chroma key background. 
No gradients, no shadows on the background, no reflections. Pure solid green background only."""
    )
    return base.replace("{theme}", theme or "classic")
