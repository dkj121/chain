namespace TestRazorApp.Models;

public class HomeViewModel
{
    public string Title { get; set; } = string.Empty;
    public string WelcomeMessage { get; set; } = string.Empty;
    public List<string> Features { get; set; } = new();
    public int VisitorCount { get; set; }
}
